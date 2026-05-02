package com.cip.interview.service;

import com.cip.common.events.CipEvent;
import com.cip.common.events.KafkaTopics;
import com.cip.common.exception.CipException;
import com.cip.interview.dto.InterviewDtos;
import com.cip.interview.entity.Interview;
import com.cip.interview.repository.InterviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final KafkaTemplate<String, CipEvent> kafkaTemplate;

    @Transactional
    public InterviewDtos.InterviewResponse startInterview(Long userId,
                                                          InterviewDtos.StartRequest request) {
        List<Map<String, Object>> questions = normalizeQuestionList(request.getQuestions());
        int numQuestions = request.getNumberOfQuestions() != null
                ? request.getNumberOfQuestions()
                : questions.size();

        Interview interview = Interview.builder()
                .userId(userId)
                .type(request.getType() != null ? request.getType() : Interview.InterviewType.TECHNICAL)
                .jobRole(request.getJobRole())
                .questions(questions)
                .answers(new ArrayList<>())
                .totalQuestions(numQuestions)
                .answeredQuestions(0)
                .status(Interview.InterviewStatus.IN_PROGRESS)
                .build();

        interview = interviewRepository.save(interview);
        log.info("Interview started: id={}, userId={}, type={}", interview.getId(), userId, interview.getType());
        return toResponse(interview);
    }

    @Transactional
    public InterviewDtos.InterviewResponse submitAnswer(Long userId,
                                                        InterviewDtos.AnswerRequest request) {
        Interview interview = interviewRepository.findByIdAndUserId(request.getInterviewId(), userId)
                .orElseThrow(() -> CipException.notFound("Interview"));

        if (interview.getStatus() != Interview.InterviewStatus.IN_PROGRESS) {
            throw CipException.badRequest("Interview is not in progress");
        }

        List<Map<String, Object>> answers = interview.getAnswers() instanceof List
                ? new ArrayList<>((List<Map<String, Object>>) interview.getAnswers())
                : new ArrayList<>();

        Map<String, Object> answerEntry = new LinkedHashMap<>();
        answerEntry.put("questionIndex", request.getQuestionIndex());
        answerEntry.put("question", request.getQuestion());
        answerEntry.put("answer", request.getAnswer());
        answerEntry.put("timeTakenSeconds", request.getTimeTakenSeconds() != null ? request.getTimeTakenSeconds() : 0);
        answerEntry.put("score", request.getScore());
        answerEntry.put("topic", request.getTopic());
        answerEntry.put("difficulty", request.getDifficulty());
        answerEntry.put("feedback", request.getFeedback());
        answers.add(answerEntry);

        interview.setAnswers(answers);
        interview.setAnsweredQuestions(answers.size());
        interview.setQuestions(mergeQuestion(interview.getQuestions(), request));
        interview = interviewRepository.save(interview);
        return toResponse(interview);
    }

    @Transactional
    public InterviewDtos.InterviewResponse endInterview(Long userId, Long interviewId) {
        Interview interview = interviewRepository.findByIdAndUserId(interviewId, userId)
                .orElseThrow(() -> CipException.notFound("Interview"));

        if (interview.getStatus() != Interview.InterviewStatus.IN_PROGRESS) {
            throw CipException.badRequest("Interview is not in progress");
        }

        double totalScore = computeInterviewScore(interview);
        interview.setTotalScore(totalScore);
        interview.setStatus(Interview.InterviewStatus.COMPLETED);
        interview.setCompletedAt(LocalDateTime.now());
        interview.setFeedback(buildSummary(interview, totalScore));
        interview = interviewRepository.save(interview);

        CipEvent event = CipEvent.interviewCompleted(userId, interviewId, totalScore);
        kafkaTemplate.send(KafkaTopics.INTERVIEW_COMPLETED, userId.toString(), event);
        log.info("Interview completed: id={}, userId={}, score={}", interviewId, userId, totalScore);

        return toResponse(interview);
    }

    public InterviewDtos.InterviewResponse getResult(Long userId, Long interviewId) {
        Interview interview = interviewRepository.findByIdAndUserId(interviewId, userId)
                .orElseThrow(() -> CipException.notFound("Interview"));
        return toResponse(interview);
    }

    public List<InterviewDtos.InterviewResponse> getHistory(Long userId) {
        return interviewRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream().map(this::toResponse).toList();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> normalizeQuestionList(Object questionsObj) {
        if (!(questionsObj instanceof List<?> list)) {
            return new ArrayList<>();
        }
        List<Map<String, Object>> questions = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map<?, ?> map) {
                questions.add(new LinkedHashMap<>((Map<String, Object>) map));
            }
        }
        return questions;
    }

    private Object mergeQuestion(Object existingQuestions, InterviewDtos.AnswerRequest request) {
        List<Map<String, Object>> questions = normalizeQuestionList(existingQuestions);
        boolean alreadyPresent = questions.stream().anyMatch(item ->
                request.getQuestionIndex() != null && request.getQuestionIndex().equals(item.get("index")));
        if (!alreadyPresent && request.getQuestion() != null && !request.getQuestion().isBlank()) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("index", request.getQuestionIndex());
            entry.put("question", request.getQuestion());
            entry.put("topic", request.getTopic());
            entry.put("difficulty", request.getDifficulty());
            questions.add(entry);
        }
        return questions;
    }

    private double computeInterviewScore(Interview interview) {
        if (!(interview.getAnswers() instanceof List<?> answers) || answers.isEmpty()) {
            return 0;
        }
        double sum = answers.stream()
                .mapToDouble(a -> {
                    if (a instanceof Map<?, ?> map) {
                        Object s = map.get("score");
                        return s instanceof Number ? ((Number) s).doubleValue() : 0;
                    }
                    return 0;
                })
                .sum();
        return sum / answers.size();
    }

    private Object buildSummary(Interview interview, double score) {
        List<String> weakTopics = new ArrayList<>();
        Object latestFeedback = null;
        if (interview.getAnswers() instanceof List<?> answers) {
            for (Object item : answers) {
                if (item instanceof Map<?, ?> map) {
                    Object itemScore = map.get("score");
                    Object topic = map.get("topic");
                    if (itemScore instanceof Number number && number.doubleValue() < 70 && topic != null) {
                        weakTopics.add(topic.toString());
                    }
                    if (map.get("feedback") != null) {
                        latestFeedback = map.get("feedback");
                    }
                }
            }
        }
        return Map.of(
                "overallScore", score,
                "completedQuestions", interview.getAnsweredQuestions(),
                "totalQuestions", interview.getTotalQuestions(),
                "weakTopics", weakTopics.stream().distinct().toList(),
                "latestFeedback", latestFeedback
        );
    }

    private InterviewDtos.InterviewResponse toResponse(Interview i) {
        return InterviewDtos.InterviewResponse.builder()
                .id(i.getId())
                .userId(i.getUserId())
                .type(i.getType())
                .status(i.getStatus())
                .jobRole(i.getJobRole())
                .questions(i.getQuestions())
                .answers(i.getAnswers())
                .totalScore(i.getTotalScore())
                .totalQuestions(i.getTotalQuestions())
                .answeredQuestions(i.getAnsweredQuestions())
                .feedback(i.getFeedback())
                .startedAt(i.getStartedAt())
                .completedAt(i.getCompletedAt())
                .build();
    }
}

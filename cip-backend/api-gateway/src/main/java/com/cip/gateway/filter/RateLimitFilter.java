package com.cip.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private static final int MAX_REQUESTS_PER_MINUTE = 100;

    public RateLimitFilter(ReactiveRedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String clientIp = exchange.getRequest().getRemoteAddress() != null
                ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                : "unknown";
        String key = "rate_limit:" + clientIp;

        return redisTemplate.opsForValue().increment(key)
                .flatMap(count -> {
                    if (count == 1) {
                        redisTemplate.expire(key, Duration.ofMinutes(1)).subscribe();
                    }
                    if (count > MAX_REQUESTS_PER_MINUTE) {
                        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                        exchange.getResponse().getHeaders().add("X-RateLimit-Limit",
                                String.valueOf(MAX_REQUESTS_PER_MINUTE));
                        byte[] bytes = "{\"success\":false,\"error\":\"Rate limit exceeded\"}".getBytes();
                        return exchange.getResponse()
                                .writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
                    }
                    exchange.getResponse().getHeaders().add("X-RateLimit-Remaining",
                            String.valueOf(MAX_REQUESTS_PER_MINUTE - count));
                    return chain.filter(exchange);
                })
                .onErrorResume(e -> chain.filter(exchange)); // Fail open on Redis error
    }

    @Override
    public int getOrder() {
        return -1;
    }
}

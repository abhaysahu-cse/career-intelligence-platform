#!/bin/bash
set -e

KAFKA_BROKER="kafka:29092"
REPLICATION_FACTOR=1

echo "⏳ Waiting for Kafka to be ready..."
cub kafka-ready -b $KAFKA_BROKER 1 30

echo "📦 Creating CIP Kafka topics..."

create_topic() {
  local topic=$1
  local partitions=$2
  local retention_ms=$3

  echo "  → Creating topic: $topic (partitions=$partitions)"

  kafka-topics --bootstrap-server $KAFKA_BROKER \
    --create \
    --if-not-exists \
    --topic "$topic" \
    --partitions "$partitions" \
    --replication-factor $REPLICATION_FACTOR \
    --config retention.ms="$retention_ms" \
    --config min.insync.replicas=1 \
    --config compression.type=lz4 \
    --config cleanup.policy=delete

  echo "  ✅ $topic created"
}

# Core event topics
create_topic "student-events"      3  604800000   # 7 days
create_topic "resume-events"       3  604800000   # 7 days
create_topic "interview-events"    3  604800000   # 7 days
create_topic "score-events"        3  604800000   # 7 days
create_topic "job-events"          6  2592000000  # 30 days (jobs need longer retention)
create_topic "notification-events" 3  86400000    # 1 day

# Dead letter queues for failed events
create_topic "student-events.dlq"      1  2592000000
create_topic "resume-events.dlq"       1  2592000000
create_topic "interview-events.dlq"    1  2592000000
create_topic "score-events.dlq"        1  2592000000
create_topic "job-events.dlq"          1  2592000000
create_topic "notification-events.dlq" 1  2592000000

echo ""
echo "✅ All Kafka topics created successfully!"
echo ""
echo "📋 Topic list:"
kafka-topics --bootstrap-server $KAFKA_BROKER --list

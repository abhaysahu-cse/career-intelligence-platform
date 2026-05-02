#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE cip_auth;
    CREATE DATABASE cip_student;
    CREATE DATABASE cip_resume;
    CREATE DATABASE cip_score;
    CREATE DATABASE cip_interview;
    CREATE DATABASE cip_job;
    CREATE DATABASE cip_recommendation;
    CREATE DATABASE cip_analytics;
EOSQL

# --- Stage 1: Common Base ---
FROM maven:3.9-eclipse-temurin-21 AS base
WORKDIR /workspace/teststate-cms
 
# 1. Cache Maven dependencies using BuildKit mount
COPY implementation/server/teststate-cms/pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B
 
# 2. Copy specification
COPY specification /specification
 
# 3. Copy source code
COPY implementation/server/teststate-cms/src ./src

# --- Stage 2a: JVM Build ---
FROM base AS build-jvm
RUN --mount=type=cache,target=/root/.m2 mvn package -DskipTests

# --- Stage 2b: Native Build ---
FROM quay.io/quarkus/ubi9-quarkus-mandrel-builder-image:jdk-21 AS build-native
USER root
RUN microdnf install -y tar gzip && \
    curl -fsSL https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.tar.gz | tar -xzC /opt && \
    ln -s /opt/apache-maven-3.9.6/bin/mvn /usr/bin/mvn
WORKDIR /workspace
COPY --from=base /specification /specification
COPY --from=base /workspace/teststate-cms /workspace/teststate-cms
WORKDIR /workspace/teststate-cms
RUN --mount=type=cache,target=/root/.m2 mvn package -Dnative -DskipTests

# --- Stage 3a: JVM Runtime (Target: jvm) ---
FROM eclipse-temurin:21-jre-alpine AS jvm
WORKDIR /work/
COPY --from=build-jvm /workspace/teststate-cms/target/quarkus-app/ /work/
EXPOSE 8080 9000
CMD ["java", "-jar", "quarkus-run.jar", "-Dquarkus.http.host=0.0.0.0"]

# --- Stage 3b: Native Runtime (Target: native) ---
FROM quay.io/quarkus/ubi9-quarkus-micro-image:2.0 AS native
WORKDIR /work/
COPY --from=build-native /workspace/teststate-cms/target/*-runner /work/application
RUN chmod 775 /work/application
EXPOSE 8080 9000
CMD ["./application", "-Dquarkus.http.host=0.0.0.0"]

#!/bin/bash

# CI/CD Runner Script for Statsig Pulumi Demo
# This script continuously runs pulumi up for multiple stacks in sequence

# Configuration
STACKS=("us-west1" "us-central1")
SLEEP_BETWEEN_RUNS=30  # 30s between runs
PULUMI_DIR="$(dirname "$0")"  # Directory where this script resides (pulumi dir)

log() {
  local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$message"
}

deploy_stack() {
  local stack="$1"
  
  log "Starting deployment for stack: $stack"
  
  # Change to the Pulumi directory
  cd "$PULUMI_DIR" || { log "Failed to change to Pulumi directory"; exit 1; }
  
  # Select the stack
  pulumi stack select "$stack" || { log "Failed to select stack $stack"; return 1; }
  
  # Run pulumi up with auto-approve
  log "Running 'pulumi up' for stack $stack"
  if pulumi up --yes; then
    log "Successfully deployed stack: $stack"
    return 0
  else
    log "ERROR: Failed to deploy stack: $stack"
    return 1
  fi
}

# Main CI/CD loop
log "Starting Statsig Pulumi CI/CD runner"
log "Configured stacks: ${STACKS[*]}"
log "Sleep interval between runs: $SLEEP_BETWEEN_RUNS seconds"

# Continuous deployment loop
while true; do
  log "Beginning new deployment cycle"
  
  # Deploy each stack
  for stack in "${STACKS[@]}"; do
    deploy_stack "$stack"
    # Brief pause between stacks
    sleep 10
  done
  
  log "Completed deployment cycle, sleeping for $SLEEP_BETWEEN_RUNS seconds"
  sleep "$SLEEP_BETWEEN_RUNS"
done 

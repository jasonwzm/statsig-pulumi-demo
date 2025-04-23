# Statsig Release Pipeline Demo

This Pulumi project deploys a Cloud Run service to a specific GCP region based on stack configuration.

## Project Structure

- `index.ts` - Main Pulumi program entry point. Reads the target region from stack configuration.

## Stack Configuration

- **Project ID:** The GCP Project ID is defined globally in `Pulumi.yaml` under `config.gcp:project`.
- **Region:** Each target deployment environment (e.g., region) should have its own stack. The stack configuration file (`Pulumi.<stack_name>.yaml`) must define the `gcp:region` value.

Example stack configuration files:

- `Pulumi.us-central1.yaml`:
  ```yaml
  config:
    gcp:region: us-central1
  ```
- `Pulumi.europe-west1.yaml`:
  ```yaml
  config:
    gcp:region: europe-west1
  ```

## Getting Started

### Prerequisites

- Pulumi CLI installed
- GCP credentials configured
- Node.js environment

### Set Global Project ID

Update the `gcp:project` value in `Pulumi.yaml` with your GCP Project ID.

### CI/CD Runner Script

The `ci-runner.sh` script simulates a CI/CD environment by continuously deploying to multiple Pulumi stacks. This allows you to test how Statsig's dynamic config affects multiple regions without manually running deployments.

#### Stacks

The following Pulumi stacks are configured:

- `us-west1`: Deploys to GCP's US West region
- `us-central1`: Deploys to GCP's US Central region

### Usage

To run the CI/CD runner:

```bash
./ci-runner.sh
```

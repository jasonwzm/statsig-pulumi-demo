import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { Statsig, StatsigOptions, StatsigUser } from "@statsig/statsig-node-core";

// Statsig Server SDK key
const statsigServerSDKKey = '';

/**
 * Deploys a ColorTeller application to Google Cloud Run with dynamic config.
 * Configuration includes environment variables that control
 * the application's behavior.
 */
async function deployCloudRun() {
  // Get the current Pulumi stack
  const stack = pulumi.getStack();

  // Create a unique deployment ID for this infrastructure deployment
  const deploymentId = `${pulumi.runtime.getProject()}-${stack}-${Date.now()}`;

  // Initialize Statsig for dynamic configuration with stack-specific environment
  const statsig = new Statsig(statsigServerSDKKey, {
    environment: "production", 
    globalCustomFields: { "region": stack }
  });

  await statsig.initialize();

  // ----- Validate required GCP configuration -----
  const projectId = gcp.config.project;
  if (!projectId) {
    throw new Error("gcp:project configuration is required");
  }

  const region = gcp.config.region;
  if (!region) {
    throw new Error("gcp:region configuration is required for this stack");
  }
  
  // Docker image to deploy in Cloud Run
  const image = "gcr.io/jasonwzm/colorteller";

  // ----- Get dynamic configuration from Statsig -----
  // Retrieve environment variables from Statsig dynamic config
  // This allows remote configuration of the service without redeployment
  const statsigUser = new StatsigUser({ userID: deploymentId });
  const config = statsig.getDynamicConfig(statsigUser, 'colorteller-cloudrun');

  // Default to blue color if no config is provided
  const envVars = config.getValue('envVars', [
    {
      name: "COLOR",
      value: "blue",
    },
  ]);

  // ----- Create Cloud Run service -----
  const serviceName = `colorteller-${region}`;

  const service = new gcp.cloudrun.Service(serviceName, {
    location: region,
    template: {
      spec: {
        containers: [
          {
            image,
            envs: envVars,
          },
        ],
      },
    },
  });

  // ----- Configure public access -----
  // Create IAM policy to allow public access to the service
  const noAuthPolicy = gcp.organizations.getIAMPolicy({
    bindings: [
      {
        role: "roles/run.invoker",
        members: ["allUsers"],
      },
    ],
  });

  // Apply the IAM policy to the Cloud Run service
  new gcp.cloudrun.IamPolicy(`noauth-${serviceName}`, {
    location: service.location,
    project: service.project,
    service: service.name,
    policyData: noAuthPolicy.then((policy) => policy.policyData),
  });

  // Clean up Statsig connection
  await statsig.shutdown();

  // Return outputs to be exported
  return {
    serviceUrl: service.statuses[0].url,
    gcpProjectId: projectId,
    deployedRegion: region,
  };
}

// ----- Deploy the infrastructure -----
const infrastructure = deployCloudRun();

// ----- Export resources for external reference -----
// The URL where the service can be accessed
export const serviceUrl = infrastructure.then(infra => infra.serviceUrl);
// The GCP project where the service is deployed
export const gcpProjectId = infrastructure.then(infra => infra.gcpProjectId);
// The region where the service is deployed
export const deployedRegion = infrastructure.then(infra => infra.deployedRegion); 

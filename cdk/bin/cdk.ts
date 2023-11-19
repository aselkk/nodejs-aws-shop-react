#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib'
import * as deployment from 'aws-cdk-lib/aws-s3-deployment'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import { config } from 'dotenv'
import path = require('path');
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';

config();

const app = new cdk.App()

const stack = new cdk.Stack(app, 'WebAppReactAws', {
  env: { region: 'us-east-1'}
})

const bucket = new s3.Bucket(stack, 'WebAppBucketRsAws', {
  bucketName: "aws-web-app-rs"
})

const originAccessIdentity = new cf.OriginAccessIdentity(stack, 'WebAppBucketOAI', {
  comment: bucket.bucketName
})

bucket.grantRead(originAccessIdentity)

const cloudfront = new cf.Distribution(stack, 'WebAppDistribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(bucket, {
      originAccessIdentity
    }),
    viewerProtocolPolicy: cf.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
  defaultRootObject: 'index.html',
  errorResponses: [
    {
      httpStatus: 404, 
      responseHttpStatus: 200,
      responsePagePath: '/index.html'
    }
  ]
})

// const cloudFrontAwsResource = new AwsCustomResource(
//   stack,
//   `CloudFrontInvalidation-${Date.now()}`,
//   {
//     onCreate: {
//       physicalResourceId: PhysicalResourceId.of(`${'WebAppDistribution'}-${Date.now()}`),
//       service: "CloudFront",
//       action: "createInvalidation",
//       parameters: {
//         DistributionId: 'WebAppDistribution',
//         InvalidationBatch: {
//           CallerReference: Date.now().toString(),
//           Paths: {
//             Quantity: 1,
//             Items: ['/*']
//           }
//         }
//       },
//     },
//     policy: AwsCustomResourcePolicy.fromSdkCalls({
//       resources: AwsCustomResourcePolicy.ANY_RESOURCE
//     }),
//   }
// );

// cloudFrontAwsResource.node.addDependency(cloudfront);

new deployment.BucketDeployment(stack, 'DeployWebApp', {
  destinationBucket: bucket,
  sources: [deployment.Source.asset(path.join(__dirname, '../../dist'))],
  distribution: cloudfront,
  distributionPaths: ['/*']
})

new cdk.CfnOutput(stack, 'Domain URL', {
  value: cloudfront.distributionDomainName
})
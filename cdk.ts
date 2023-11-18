import * as cdk from 'aws-cdk-lib'
import * as deployment from 'aws-cdk-lib/aws-s3-deployment'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import { config } from 'dotenv'

config();

const app = new cdk.App()

const stack = new cdk.Stack(app, 'AwsShopReact', {
  env: { region: 'eu-west-3'}
})

const bucket = new s3.Bucket(stack, 'WebAppBucket', {
  bucketName: "rs-aws-course-app"
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

new deployment.BucketDeployment(stack, 'DeployWebApp', {
  destinationBucket: bucket,
  sources: [deployment.Source.asset('./dist')],
  distribution: cloudfront,
  distributionPaths: ['/*']
})

new cdk.CfnOutput(stack, 'Domain URL', {
  value: cloudfront.distributionDomainName
})
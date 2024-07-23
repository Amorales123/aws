<h1 align="center">Logging into S3 with FireLens & Cloudwatch logs</h1>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](/LICENSE)

</div>

## 📝 Table of Contents

- [About](#about)
- [Docker](#Docker_Requisites)
- [aws Roles](#aws_roles)
  - [click-counter-app-ecs-role](#click-counter-app-ecs-role-v2)
  - [FireLensS3Role](#FireLensS3Role)
- [Aws resources](#aws_resources)
  - [ECR](#ECR)
  - [ECS](#ECS)
    - [TaskDefinition](#TaskDefinition)
- [Rollback (Clean Up Resources)](#Rollback)
- [TODO](../TODO.md)
- [Authors](#authors)

## 🧐 About <a name = "about"></a>

The following projects shows how to deploy an easy project with aws architecture into ecs fargate, using some services like ecr, ecs, s3 and Firelens as routing logs.

## 🏁 Docker Requisites <a name = "Docker_Requisites"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

install docker in your environment


### `Build and Push Docker Image`

Ensure change your settings in `<AWS_REGION>` like `1234567890` Sections below:
```sh
docker build -t click-counter-app:latest .
aws ecr get-login-password --region <AWS_REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com
docker tag click-counter-app:latest <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/click-counter-app:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/click-counter-app:latest
```

## 🏁 AWS Roles <a name = "#aws_roles"></a>
These instructio
### Prerequisites
install AWS CLI in your environment and consider replace the folowing variables to your environment values:
### Variables to Replace:
- `<AWS_REGION>`
- `<AWS_ACCOUNT_ID>`
- `<S3_BUCKET_NAME>`
- `<ECS_CLUSTER_NAME>`
- `<ECS_SERVICE_NAME>`                        


## click-counter-app-ecs-role-v2:

### `Create and Configure IAM Roles`
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

```
### Create the role `click-counter-app-ecs-role-v2`:
```sh
aws iam create-role --role-name click-counter-app-ecs-role-v2 --assume-role-policy-document file://click-counter-app-ecs-role-trust-policy.json

```
### Create the policy  `click-counter-app-ecs-policy-v2.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:CreateCluster",
        "ecs:DeregisterContainerInstance",
        "ecs:DiscoverPollEndpoint",
        "ecs:Poll",
        "ecs:RegisterContainerInstance",
        "ecs:StartTelemetrySession",
        "ecs:Submit*",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetObjectTagging"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/FireLensS3Role"
    }
  ]
}
```
### Create and attach the policy to the role:
```sh
aws iam create-policy --policy-name click-counter-app-ecs-policy-v2 --policy-document file://click-counter-app-ecs-policy-v2.json
aws iam attach-role-policy --role-name click-counter-app-ecs-role-v2 --policy-arn arn:aws:iam::<AWS_ACCOUNT_ID>:policy/click-counter-app-ecs-policy-v2
aws iam attach-role-policy --role-name click-counter-app-ecs-role-v2 --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```
## FireLensS3Role:
### Create the trust policy `firelens-trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}

```
### Apply the trust policy:
```sh
aws iam update-assume-role-policy --role-name FireLensS3Role --policy-document file://firelens-trust-policy.json

```

### Create the policy `firelens-s3-role-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetObjectTagging"
      ],
      "Resource": "arn:aws:s3:::<S3_BUCKET_NAME>/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:<AWS_REGION>:<AWS_ACCOUNT_ID>:log-group:/ecs/click-counter-app-v2",
        "arn:aws:logs:<AWS_REGION>:<AWS_ACCOUNT_ID>:log-group:/ecs/click-counter-app-v2:*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sts:AssumeRole"
      ],
      "Resource": "*"
    }
  ]
}
```
### Apply the policy to the role `FireLensS3Role`:
```sh
aws iam put-role-policy --role-name FireLensS3Role --policy-name S3FireLensPolicy --policy-document file://firelens-s3-role-policy.json
```
## 🏁 AWS Resources <a name = "aws_resources"></a>
### Prerequisites
install AWS CLI in your environment and consider replace the folowing variables to your environment values:
### Variables to Replace:
- `<AWS_REGION>`
- `<AWS_ACCOUNT_ID>`
- `<S3_BUCKET_NAME>`
- `<ECS_CLUSTER_NAME>`
- `<ECS_SERVICE_NAME>` 
## ECR
### Build and Push Docker Image:
### Step 1: Create ECR Repository
```sh
aws ecr create-repository --repository-name click-counter-app --region <AWS_REGION>
```
### Step 2: Build Docker Image
```sh
docker build -t click-counter-app .
```

### Step 3: Login to ECR
```sh
aws ecr get-login-password --region <AWS_REGION> | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com

```

### Step 4: Tag and Push Docker Image
```sh
docker tag click-counter-app:latest <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/click-counter-app:latest
docker push <AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/click-counter-app:latest
```

## ECS
Create cluster `click-counter-app-cluster` into ecs
```sh
aws ecs create-cluster --cluster-name click-counter-app-cluster
```
## TaskDefinition
### Create a file `task-definition.json` with the following content:
```json
{
  "family": "click-counter-app-task-v2",
  "networkMode": "awsvpc",
  "executionRoleArn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/click-counter-app-ecs-role-v2",
  "taskRoleArn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/FireLensS3Role",
  "containerDefinitions": [
    {
      "name": "click-counter-app-container",
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.<AWS_REGION>.amazonaws.com/click-counter-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000
        }
      ],
      "logConfiguration": {
        "logDriver": "awsfirelens",
        "options": {
          "Name": "s3",
          "region": "<AWS_REGION>",
          "bucket": "<S3_BUCKET_NAME>",
          "use_put_object": "true",
          "total_file_size": "10m",
          "upload_timeout": "10s",
          "s3_key_format": "/logs/app/%Y/%m/%d/%H/logs_ecs_$uuid_flush.log",
          "role_arn": "arn:aws:iam::<AWS_ACCOUNT_ID>:role/FireLensS3Role"
        }
      },
      "essential": true
    },
    {
      "name": "log_router",
      "image": "amazon/aws-for-fluent-bit:latest",
      "essential": true,
      "firelensConfiguration": {
        "type": "fluentbit",
        "options": {
          "enable-ecs-log-metadata": "true"
        }
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/click-counter-app-v2",
          "awslogs-region": "<AWS_REGION>",
          "awslogs-stream-prefix": "firelens"
        }
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512"
}
```

### Register and Deploy the ECS Task:
```sh
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Create Service:
```sh
aws ecs create-service --cluster click-counter-app-cluster --service-name click-counter-app-service --task-definition click-counter-app-task --desired-count 1 --launch-type FARGATE --network-configuration '{
  "awsvpcConfiguration": {
    "subnets": ["<SUBNET_A>", "<SUBNET_B>"],
    "securityGroups": ["<SECURITY_GROUP>"],
    "assignPublicIp": "ENABLED"
  }
}'
```

### Verification:
1. Verify that the service is running correctly:
```sh
aws ecs describe-services --cluster <ECS_CLUSTER_NAME> --services <ECS_SERVICE_NAME>
```

2. Verify the running tasks:
```sh
aws ecs list-tasks --cluster <ECS_CLUSTER_NAME> --service-name <ECS_SERVICE_NAME>
```

3. Describe the task to get the public IP:
```sh
aws ecs describe-tasks --cluster <ECS_CLUSTER_NAME> --tasks <task-arn>
```

4. Access the web application using the public IP:
```sh
http://<public-ip>:3000
```

## 🏁 Rollback (Clean Up Resources) <a name = "RollBack"></a>
To clean up all created resources, follow these steps:
### 1. Stop and Delete the ECS Service:
```sh
aws ecs update-service --cluster <ECS_CLUSTER_NAME> --service <ECS_SERVICE_NAME> --desired-count 0
aws ecs delete-service --cluster <ECS_CLUSTER_NAME> --service <ECS_SERVICE_NAME>
```

### 2. Deregister the Task Definition:
```sh
aws ecs deregister-task-definition --task-definition click-counter-app-task-v2
```

### 3. Delete IAM Policies and Roles:
Delete the `FireLensS3Role` Policy
```sh
aws iam delete-role-policy --role-name FireLensS3Role --policy-name S3FireLensPolicy
aws iam delete-role --role-name FireLensS3Role
```
Delete the `click-counter-app-ecs-role-v2` Policy and Role
```sh
aws iam detach-role-policy --role-name click-counter-app-ecs-role-v2 --policy-arn arn:aws:iam::<AWS_ACCOUNT_ID>:policy/click-counter-app-ecs-policy-v2
aws iam detach-role-policy --role-name click-counter-app-ecs-role-v2 --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam delete-role-policy --role-name click-counter-app-ecs-role-v2 --policy-name click-counter-app-ecs-policy-v2
aws iam delete-role --role-name click-counter-app-ecs-role-v2
aws iam delete-policy --policy-arn arn:aws:iam::<AWS_ACCOUNT_ID>:policy/click-counter-app-ecs-policy-v2
```

### 4. Clean Up Logs in CloudWatch and S3:
```sh
aws logs delete-log-group --log-group-name /ecs/click-counter-app-v2
```

### 5. Delete ECR registry

```sh
aws ecr delete-repository --repository-name <repository_name> --region <AWS_REGION> --force
```

### Delete Logs in S3:
Navigate to your bucket `<S3_BUCKET_NAME>` and delete the folder logs/click-counter-app.



## ✍️ Authors <a name = "authors"></a>

- [@Amorales](https://github.com/Amorales123) - Idea & Initial work
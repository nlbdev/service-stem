# service-stem

A microservice to generate text content and images based on MathML.

## Installation

### For local development

1. Clone this repository
    - Install: GitKraken and follow their guide on [how to clone a repo](https://www.gitkraken.com/learn/git/git-clone)
2. Install pre-requisites: NodeJS 14.19.3 <https://nodejs.org/en/blog/release/v14.19.3/> (Due to a bug in SSL, we cannot use the latest stable)
2. Create a new file in the root folder for the repo called: `.env` and copy the content from `config.env.example` and fill in the required environment variables
3. Inside the repo in GitKraken, press "Show/hide terminal"
4. Type `npm i -g nodemon yarn`
5. Type `yarn serve`
6. The service should now be running locally with the host details specified in the `.env` file - you can edit the files and it will update the service continuously.

### For live servers

1. Install Docker <https://www.docker.com/>
2. Create a new file on root folder for the repo called: `.env` and copy the content from `config.env.example` and fill in the required environment variables
3. Build the Docker image with `yarn build`
4. Run the Docker image in any Docker environment, the health check will report if the container is healthy or not
5. You can access the container through your normal production environment with the host details specified in the `.env` file

## Usage

Use "curl" from the command-line: to test this service.

Replace `[HOST]` and `[PORT]` with appropriate values from the `.env` file.

Replace "content" with appropriate MathML that you want to test.

```bash
curl -H 'Content-Type: application/json' \
      -d '{ "contentType": "math", "content": "<m:math xmlns:m=\"http://www.w3.org/1998/Math/MathML\" xml:lang=\"en\" altimg=\"img\" alttext=\"3-2=1\" display=\"block\" class=\"math\"><m:mn>3</m:mn><m:mo>-</m:mo><m:mn>2</m:mn><m:mo>=</m:mo><m:mn>1</m:mn></m:math>" }' \
      -X POST \
      http://[HOST]:[PORT]/
```

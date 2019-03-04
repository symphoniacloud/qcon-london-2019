import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

if (!process.env.MESSAGES_TABLE) {
    throw new Error('Environment variables "MESSAGES_TABLE" must be set.');
}
const MESSAGES_TABLE = process.env.MESSAGES_TABLE;

if (!process.env.REGION) {
    throw new Error('Environment variables "REGION" must be set.');
}
const REGION = process.env.REGION;

const documentClient = new DocumentClient();

export async function handler(_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {

    try {

        let queryResponse = await documentClient.query({
            TableName: MESSAGES_TABLE,
            ScanIndexForward: false,
            Limit: 100,
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: {
                '#type': 'type'
            },
            ExpressionAttributeValues: {
                ':type': 'message'
            },
            IndexName: 'messages_by_ts'
        }).promise();

        let messages = (queryResponse.Items || []).map(item => {
            item.region = REGION;
            return item;
        })

        console.log(`queryResponse: ${JSON.stringify(messages)}`);

        return {
            statusCode: 200,
            body: JSON.stringify(messages),
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        };
    } catch (err) {
        console.log(`err: ${JSON.stringify(err)}`);
        return {
            statusCode: 500,
            body: `err: ${JSON.stringify(err)}`
        };
    }
}
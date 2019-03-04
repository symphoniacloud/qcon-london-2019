import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

if (!process.env.MESSAGES_TABLE) {
    throw new Error('Environment variables "MESSAGES_TABLE" must be set.');
}
const MESSAGES_TABLE = process.env.MESSAGES_TABLE;

const documentClient = new DocumentClient();

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {

    console.log(`event: ${JSON.stringify(event)}`);

    let { message } = JSON.parse(event.body || '{}');

    if (message) {
        let params: DocumentClient.PutItemInput = {
            TableName: MESSAGES_TABLE,
            Item: {
                id: event.requestContext.messageId,
                ts: new Date().getTime(),
                type: 'message',
                message: message,
                source: event.requestContext.connectionId
            }
        };
        console.log(`params: ${JSON.stringify(params)}`)

        try {
            let response = await documentClient.put(params).promise();
            console.log(`response: ${JSON.stringify(response)}`);
            return {
                statusCode: 200,
                body: 'Send ok'
            };
        } catch (err) {
            return {
                statusCode: 500,
                body: `err: ${JSON.stringify(err)}`
            };
        }
    } else {
        return {
            statusCode: 500,
            body: 'Invalid message'
        }
    }

};
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

if (!process.env.TABLE_NAME) {
    throw new Error('Environment variables "TABLE_NAME" must be set.');
}
const TABLE_NAME = process.env.TABLE_NAME;

const documentClient = new DocumentClient();

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    let params: DocumentClient.PutItemInput = {
        TableName: TABLE_NAME,
        Item: {
            type: 'connection',
            id: event.requestContext.connectionId
        }
    };

    console.log(`params: ${ JSON.stringify(params) }`)

    try {
        let response = await documentClient.put(params).promise();
        console.log(`response: ${ JSON.stringify(response) }`);
        return {
            statusCode: 200,
            body: 'Connect ok'
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: `err: ${JSON.stringify(err) }`
        };
    }
};
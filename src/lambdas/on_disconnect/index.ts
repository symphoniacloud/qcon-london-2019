import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

if (!process.env.CONNECTIONS_TABLE) {
    throw new Error('Environment variables "CONNECTIONS_TABLE" must be set.');
}
const CONNECTIONS_TABLE = process.env.CONNECTIONS_TABLE;

const documentClient = new DocumentClient();

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    let params: DocumentClient.DeleteItemInput = {
        TableName: CONNECTIONS_TABLE,
        Key: {
            id: event.requestContext.connectionId
        }
    };

    console.log(`params: ${JSON.stringify(params)}`)

    try {
        let response = await documentClient.delete(params).promise();
        console.log(`response: ${JSON.stringify(response)}`);
        return {
            statusCode: 200,
            body: 'Delete ok'
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: `err: ${JSON.stringify(err)}`
        };
    }
};
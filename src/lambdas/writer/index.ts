import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const documentClient = new DocumentClient();

if (! process.env.TABLE_NAME) {
    throw new Error('Environment variables "TABLE_NAME" must be set.');
}
const TABLE_NAME = process.env.TABLE_NAME;

export async function handler ({ body }: APIGatewayProxyEvent, ctx: Context): Promise<APIGatewayProxyResult> {
    if (body) {
        try {
            const response = await documentClient.put({
                TableName: TABLE_NAME,
                Item: JSON.parse(body)
            }).promise();
            if (response) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        awsRequestId: ctx.awsRequestId,
                        invokedFunctionArn: ctx.invokedFunctionArn
                    })
                };
            } else {
                return {
                    statusCode: 500,
                    body: 'Error awaiting response from database.'
                };
            }
        } catch (err) {
            return {
                statusCode: 500,
                body: `Error writing to '${ TABLE_NAME }': ${ err }`
            };
        }
    } else {
        return {
            statusCode: 400,
            body: 'Malformed request'
        };
    }
}

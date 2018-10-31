 import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
 
 export async function handler (_event: APIGatewayProxyEvent ): Promise<APIGatewayProxyResult> {
     return {
         statusCode: 200,
         body: 'Ok'
     };
    //  return {
    //      statusCode: 500,
    //      body: 'Internal Server Error'
    //  };
 }
 
 
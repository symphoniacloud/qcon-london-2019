port module Main exposing (Model, Msg(..), inbound, init, main, outbound, update, view)

import Browser
import Browser.Dom as Dom
import Browser.Navigation as Nav
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode
import Json.Encode
import Task


type alias Message =
    { message : String
    , timestamp : Int
    }


toMessage : SocketMessage -> Message
toMessage sm =
    Message sm.message (String.toInt sm.timestamp |> Maybe.withDefault 0)


type alias SocketMessage =
    { message : String
    , timestamp : String
    }


type alias Model =
    { error : Maybe String
    , username : Maybe String
    , input : Maybe String
    , messages : List Message
    }


init : ( Model, Cmd Msg )
init =
    ( Model Nothing Nothing Nothing []
    , Http.get
        { url = "https://api.qcon.symphonia.io/history"
        , expect = Http.expectJson LoadHistory historyDecoder
        }
    )



-- UPDATE


type Msg
    = NoOp
    | LoadHistory (Result Http.Error (List Message))
    | UpdateInput String
    | SendMessage
    | WebSocketIn Json.Encode.Value


update : Msg -> Model -> ( Model, Cmd Msg )
update message model =
    case message of
        NoOp ->
            ( model, Cmd.none )

        WebSocketIn json ->
            let
                decodedMessages =
                    Json.Decode.decodeValue socketDecoder json
            in
            case decodedMessages of
                Result.Ok socketMessages ->
                    let
                        newMessages =
                            List.map toMessage socketMessages
                    in
                    ( { model | messages = List.append model.messages newMessages }, jumpToBottom "content" )

                Result.Err err ->
                    ( { model | error = Just (Json.Decode.errorToString err) }, Cmd.none )

        LoadHistory (Result.Ok messages) ->
            ( { model | messages = messages }, jumpToBottom "content" )

        LoadHistory (Result.Err _) ->
            ( { model | error = Just "HTTP error" }, Cmd.none )

        UpdateInput input ->
            ( { model | input = Just input }, Cmd.none )

        SendMessage ->
            case model.input of
                Just input ->
                    ( { model | input = Nothing }
                    , messageEncoder input |> outbound
                    )

                Nothing ->
                    ( model, Cmd.none )


historyDecoder : Json.Decode.Decoder (List Message)
historyDecoder =
    Json.Decode.list historyMessageDecoder


historyMessageDecoder : Json.Decode.Decoder Message
historyMessageDecoder =
    Json.Decode.map2 Message
        (Json.Decode.field "message" Json.Decode.string)
        (Json.Decode.field "ts" Json.Decode.int)


socketDecoder : Json.Decode.Decoder (List SocketMessage)
socketDecoder =
    Json.Decode.list socketMessageDecoder


socketMessageDecoder : Json.Decode.Decoder SocketMessage
socketMessageDecoder =
    Json.Decode.map2 SocketMessage
        (Json.Decode.field "message" Json.Decode.string)
        (Json.Decode.field "ts" Json.Decode.string)


messageEncoder : String -> Json.Encode.Value
messageEncoder s =
    Json.Encode.object
        [ ( "message", Json.Encode.string s )
        , ( "action", Json.Encode.string "send" )
        ]


jumpToBottom : String -> Cmd Msg
jumpToBottom id =
    Dom.getViewportOf id
        |> Task.andThen (\info -> Dom.setViewportOf id 0 info.scene.height)
        |> Task.attempt (\_ -> NoOp)


view : Model -> Html Msg
view model =
    div [ class "container" ]
        [ p [] [ text "Welcome to Quack!" ]

        -- , p [] [ text (Maybe.withDefault "none" model.error) ]
        , div [ class "pure-g" ]
            [ div [ id "content", class "pure-u content" ]
                (List.sortBy .timestamp model.messages |> List.map viewMessage)
            , div [ class "pure-u pure-u-1 controls" ]
                [ Html.form [ class "pure-form pure-u-1", onSubmit SendMessage ]
                    [ input [ class "pure-input-1", type_ "text", placeholder "What's the good word?", value (Maybe.withDefault "" model.input), onInput UpdateInput ] []
                    -- , div [ class "pure-input-1-4" ]
                    --     [ input [ class "pure-button pure-button-primary", type_ "submit", class "", value "Send" ] [] ]
                    ]
                ]
            ]
        ]


viewMessage : Message -> Html Msg
viewMessage message =
    p [ class "message" ] [ text message.message ]



-- MAIN


port outbound : Json.Encode.Value -> Cmd msg


port inbound : (Json.Encode.Value -> msg) -> Sub msg


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ inbound WebSocketIn
        ]


main : Program () Model Msg
main =
    Browser.document
        { init = \_ -> init
        , view =
            \m ->
                { title = "Quack"
                , body = [ view m ]
                }
        , update = update
        , subscriptions = subscriptions
        }

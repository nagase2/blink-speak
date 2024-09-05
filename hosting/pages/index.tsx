// Importing necessary modules from Next.js and Material UI libraries
import Link from "next/link";
import Head from "next/head";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import MicIcon from '@mui/icons-material/Mic';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Icon,
  IconButton,
  InputBase,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import "../css/shake.module.css";
import axios from "axios";
import { useRouter } from "next/router";
import { nanoid } from "@reduxjs/toolkit";
import { useEffect, useRef, useState } from "react";
import { AnswerResult } from "../types/AnswerResult.type";
import LinearProgress from '@mui/material-next/LinearProgress';
const MicRecorder = require('mic-recorder-to-mp3')

import ResultBox from "../features/answer-result/ResultBox";
import Demo from "../components/Demo";
import useQuestion from "../hooks/useQuestion";
import { RecordingStatus } from "../types/RecordingStatus";
import StaticCard from "../features/answer-result/StaticCard";
// Defining the IndexPage component as default export



export default function IndexPage() {
  const router = useRouter();
  const [questionNum, setQuestionNum] = useState(0);
  const [answer, setAnswer] = useState("");
  // const [isLoading, setIsloading] = useState(false);
  const [result, setResult] = useState<AnswerResult[]>([]);
  const [transcript, setTranscript] = useState('')

  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>("STOPPED")

  // 録音関連
  const recorder = useRef<typeof MicRecorder>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  // const [recording, setRecording] = useState(false)
  // const [loading, setLoading] = useState(false)

  // エラーの時に揺らす
  const [shake, setShake] = useState(false);
  const { getNewQuestion, getCurrentQuestion, isQuestionLoading } = useQuestion();

  const category = ["一般"]
  const level = 400

  useEffect(() => {
    // サーバサイドから問題を取得する
    const fn = async () => {
      // const response = await fetch(`api/ai/question`, {
      //   method: 'GET',
      //   // body: formData,
      // })
      // FIXME:一旦固定でカテゴリとレベルを指定するが、実際にはここはユーザ指定のものを渡す様にする
      const res = await getNewQuestion({ level: level, category: category })

      // console.log("🐮!!!", await response.json())
      console.log("🐮🐮!!!", res)
      //setQuestionNum(Math.floor(Math.random() * (questionList.length - 1)));
    }
    fn()
    recorder.current = new MicRecorder({ bitRate: 256 })
  }, []);

  useEffect(() => {
    console.log("取得した音声ファイル", audioFile)
    const fn = async () => {
      setRecordingStatus("LOADING")

      try {
        if (audioFile) {
          // 送信データ
          let formData = new FormData()
          formData.append('file', audioFile)
          console.log(formData.entries)

          // Whisper APIにリクエストを投げて文字おこしをする
          const response = await fetch(`/api/whisper`, {
            method: 'POST',
            body: formData,
          })
          const response_data = await response.json()
          console.log("🐮", response_data)
          setAnswer(response_data.transcript)
          // 音声認識チェック
          if (response_data.transcript) {
            setTranscript(response_data.transcript)
          }
        } else {
          console.log("🐮 no audio file")
        }
      } catch (error) {
        console.log("Error", error)
        alert("🐔" + error)
        // setLoading(false)
      } finally {
        setRecordingStatus("STOPPED")
      }
      setAudioFile(null)
    }
    fn()
  }, [audioFile])


  const handleRecodringButton = async () => {
    if (recordingStatus === "STOPPED") {
      startRecording()
    } else if (recordingStatus === "RECORDING") {
      stopRecording()
    }
  }
  /**
   * 音声録音開始
   */
  const startRecording = async () => {
    // ストップウォッチ開始
    //reset()
    // 録音開始
    await recorder.current
      .start()
      .then(() => {
        // setRecording(true)
        setRecordingStatus("RECORDING")
      })
      .catch((error: string) => {
        console.error(error)
      })
  }

  /**
   * 音声録音停止
   */
  const stopRecording = async () => {
    console.log("stopRecording")

    // ストップウォッチ停止
    // pause()
    // 録音停止
    await recorder.current
      .stop()
      .getMp3()
      .then(([buffer, blob]: any) => {
        // 音声ファイル生成
        const file = new File(buffer, 'audio.mp3', {
          type: blob.type,
          lastModified: Date.now(),
        })
        // 録音停止
        // setRecordingStatus("STOPPED")
        setAudioFile(file)
      })
      .catch((error: string) => {
        console.log(error)
        // setLoading(false)
        setRecordingStatus("STOPPED")
      })
    // 録音停止
    //setRecording(false)
  }

  /**
   * 回答ボタンを押したときの処理
   */
  const handleAnswerClick = async () => {
    console.log("回答ボタンが押されました。");
    // 回答が入力されていない場合は処理を中断する
    if (answer.length == 0) {
      console.log("揺らします")
      setShake(true);
      setTimeout(() => setShake(false), 500); // アニメーションの時間に合わせて状態をリセット

      return
    }
    const newId = nanoid();
    try {
      //setIsloading(true);
      // ここで配列をついか
      setResult([...result, { key: newId, message: "待機中", is_loading: true }]);
      const response = axios
        .get(
          `/api/ai/chat?id=${newId}&question=${getCurrentQuestion().contents}&answer=${answer}`
        )
        .then((response) => {
          // TODO: ここで配列を更新する。IDを使って検索
          //console.log("🐔", response.data.message.kwargs.content);
          const responseJson: AnswerResult = JSON.parse(response.data.message.kwargs.content)
          setResult([...result, { ...responseJson, is_loading: false }]);

          //          const data = response.data;
          // const updatedItems = result.map(item => {
          //   console.log("⭐️")
          //   if (item.id === responseJson.id) {
          //     return responseJson; // IDが一致する場合、名前を更新する
          //   }
          //   return item;
          // });
          // console.log(updatedItems);
          // setResult(updatedItems);
        });
      //解答欄を空白にする
      setAnswer("");
      // 問題更新
      // setQuestionNum(Math.floor(Math.random() * (questionList.length - 1)));
      getNewQuestion({ level: level, category: category })

    } catch (error) {
      console.error(error);
    } finally {
      //setLoading(false);

    }
  };

  // Returning the JSX elements to render on the page
  return (
    <>
      <Head>
        <title>😄BlinkSpeak😃</title>
      </Head>

      <ResponsiveAppBar />

      {/* <Stack direction="row" spacing={2}>
        <Grid container >
          <Grid item xs={8}> */}

      <Grid item sx={{ padding: "30px" }} xs={12} sm={6}>
        <Container maxWidth="md">
          <Grid container spacing={2}>
            <Grid container spacing={1}>
              <Grid item xs={3} sm={3}>
                <StaticCard title="今日の回答数" contents="23/234位" />
              </Grid>
              <Grid item xs={3} sm={3}>
                <StaticCard title="今月の回答数" contents="23/234位" />
              </Grid>
              <Grid item xs={3} sm={3}>
                <StaticCard title="これまでの回答数" contents="23/234位" />
              </Grid>
              <Grid item xs={3} sm={3}>
                <StaticCard title="これまでの回答数" contents="23/234位" />
              </Grid>
            </Grid>
            <Grid item xs={12} sm={12}>
              <Chip color="default" size="small" label="TOEIC 400" />{" "}
              <Chip color="default" size="small" label="一般" />{" "}
              <Chip color="default" size="small" label="IT" />
            </Grid>

            <Grid item xs={12} sm={12}>
              <Box sx={{
                // display: 'flex',
                // alignItems: 'center',
                // justifyContent: 'center',
                //  height: "30px"
              }}>
                <Typography sx={{ fontSize: "20px" }}>
                  {
                    // FIXME: LoadingIconに変える
                    isQuestionLoading ? <Skeleton variant="text" sx={{ fontSize: '1.3rem' }} /> :
                      getCurrentQuestion() ? getCurrentQuestion().contents : ""
                  }
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={12}>
              <Paper
                component="form"
                sx={{
                  p: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  border: "1px solid",
                  borderColor: "grey.300",
                  position: 'relative', // Make this a positioning context for absolute positioning
                  //boxShadow: '0px 3px 10px 6px rgba(0, 0, 0, 0.2)',
                }}>
                <InputBase
                  id="MessageInputBox"
                  sx={{
                    ml: 1,
                    flex: 1,
                    minHeight: '38px',

                  }}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className={shake ? 'shake-animation' : ''}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // Enterキーでの自動送信を防ぐ
                      handleAnswerClick(); // Enterキーが押されたときに呼び出す関数
                    }
                  }}
                // placeholder={placeholder}
                // value={messageInputBoxValue} // 追加 FIXME: 名前修正必要
                // onChange={onChange} // 追加  FIXME: 名前修正必要
                // onKeyDown={onKeyDown} // FIXME: 名前修正必要
                // onCompositionStart={onCompositionStart}
                // onCompositionEnd={onCompositionEnd}
                // multiline
                // maxRows={10}
                // inputRef={inputElement}

                />
                <Stack direction="row" justifyContent="space-around" alignItems="stretch" spacing={0.5} sx={{ position: 'absolute', bottom: 0, right: 2 }}>
                  <Tooltip title={`音声で入力`} arrow>
                    <IconButton
                      id="messageSubmitButton"
                      color="primary"
                      sx={{ position: 'relative', bottom: 0 }}
                      aria-label="messages"
                      onClick={handleRecodringButton}
                    >
                      {recordingStatus === "STOPPED" ? (
                        <MicIcon />
                      ) :
                        recordingStatus === "RECORDING" ? <StopCircleIcon />
                          :
                          recordingStatus === "LOADING" ? <CircularProgress size={20} /> : ""
                      }
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>

              {/* <TextField
                  fullWidth
                  sx={{ maxWidth: "md" }}
                  id="outlined-basic"
                  size="small"
                  onChange={(e) => setAnswer(e.target.value)}
                  //label="Outlined"
                  variant="outlined"
                  value={answer}
                  helperText="ここに回答を入力"
                  // FIXME: 揺らせない・・・クラスを指定する方法が間違っている？？
                  className={shake ? 'shake-animation' : ''}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // Enterキーでの自動送信を防ぐ
                      handleAnswerClick(); // Enterキーが押されたときに呼び出す関数
                    }
                  }}
                /> */}
            </Grid>
            <Grid item xs={12} sm={12}>
              <Button variant="contained" onClick={handleAnswerClick} >
                回答＆次の質問へ
              </Button>
              {/* {recording ?
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={stopRecording}
                    sx={{ minWidth: "150px" }}
                  >🔸停止</Button>
                  :
                  <Button
                    variant="outlined"
                    color="info"
                    onClick={startRecording}
                    // startIcon={<BlockIcon />}
                    sx={{ minWidth: "150px" }}
                  >
                    音声で入力
                  </Button> */}

            </Grid>
            <Grid item xs={12} sm={12}>
              {/* {recording ?
                  <span>🔴録音中</span>
                  :
                  <span>🔵停止中</span>} */}
            </Grid>
          </Grid>

          <Box sx={{ padding: "4px" }}>
            {/* ここで回答結果を表示する */}
            {[...result].reverse().map((item, index) => {
              return (
                <>
                  <Paper sx={{ padding: "15px" }}>
                    <ResultBox {...item} />
                  </Paper>
                  {/* <pre>{JSON.stringify(item, null, " ")}</pre> */}
                </>
              );
            })}

            {/* 
              <Link href="/day">Day</Link>
              <hr />
              <Link href="redux-sample">redux-sample</Link> */}
          </Box>
        </Container>
      </Grid>


    </>
  );
}

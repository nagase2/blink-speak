// Importing necessary modules from Next.js and Material UI libraries
import Link from "next/link";
import Head from "next/head";
import ResponsiveAppBar from "../components/ResponsiveAppBar";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Icon,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import { nanoid } from "@reduxjs/toolkit";
import { useEffect, useRef, useState } from "react";
import { AnswerResult } from "../types/AnswerResult.type";
import BlockIcon from "@mui/icons-material/Block";
import Pokemon from "../components/Pokemon";
import cuid from 'cuid';

const MicRecorder = require('mic-recorder-to-mp3')

import ResultBox from "../features/answer-result/ResultBox";
import Demo from "../components/Demo";
// Defining the IndexPage component as default export
export default function IndexPage() {
  const router = useRouter();
  const [questionNum, setQuestionNum] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsloading] = useState(false);
  const [result, setResult] = useState<AnswerResult[]>([]);
  const [loading, setLoading] = useState(false)
  const [transcript, setTranscript] = useState('')
  // 録音関連
  const recorder = useRef<typeof MicRecorder>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [recording, setRecording] = useState(false)

  // 問題はDBから取得できる様にあらかじめ用意しておく。
  const questionList = [
    { id: nanoid, contents: "これはあなたのペンですか？" },
    { id: nanoid, contents: "私は東京に住んでいます。" },
    { id: nanoid, contents: "今日目覚ましを8時にセットしました" },
    { id: nanoid, contents: "私は、名古屋出身です" },
    { id: nanoid, contents: "今日は朝ごはんを食べましたか？" },
    { id: nanoid, contents: "今日見た映画は、とても感動的でした。" },
    { id: nanoid, contents: "もし私がカエルだったら草を食べていたでしょう" },
    { id: nanoid, contents: "海外に行ったことはありますか？" },
    { id: nanoid, contents: "どんな食べ物が好きですか？" },
    { id: nanoid, contents: "沖縄は日本のどのあたりにありますか？" },
    { id: nanoid, contents: "東京にはたくさんの外国人が訪れています。" },
    { id: nanoid, contents: "私はこの前のテストで１００点を取りました。" },
  ];

  useEffect(() => {
    setQuestionNum(Math.floor(Math.random() * (questionList.length - 1)));
    recorder.current = new MicRecorder({ bitRate: 128 })
  }, []);

  useEffect(() => {
    console.log("取得した音声ファイル", audioFile)
    const fn = async () => {
      try {
        if (audioFile) {
          // 送信データ
          let formData = new FormData()
          formData.append('file', audioFile)
          formData.append('xxxxx', 'aaaaa')
          console.log(formData.entries)

          // Whisper API
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
        console.log("errorrrrrr")
        alert("🐔" + error)
        setLoading(false)
      }
      setAudioFile(null)
    }

    fn()
  }, [audioFile])

  // 音声録音開始
  const startRecording = async () => {
    // ストップウォッチ開始
    //reset()
    // 録音開始
    await recorder.current
      .start()
      .then(() => {
        setRecording(true)
      })
      .catch((error: string) => {
        console.error(error)
      })
  }
  // 音声録音停止
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
        setLoading(true)
        setAudioFile(file)
      })
      .catch((error: string) => {
        console.log(error)
        setLoading(false)
      })

    // 録音停止
    setRecording(false)
  }

  /**
   * 回答ボタンを押したときの処理
   */
  const handleClick = async () => {
    console.log("Click happened");
    const newId = nanoid();
    try {
      //setIsloading(true);
      // ここで配列をついか
      setResult([...result, { key: newId, message: "待機中", is_loading: true }]);
      const response = axios
        .get(
          `/api/ai/chat?id=${newId}&question=${questionList[questionNum].contents}&answer=${answer}`
        )
        .then((response) => {
          // TODO: ここで配列を更新する。IDを使って検索
          const responseJson: AnswerResult = JSON.parse(response.data.message.text)
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
      setQuestionNum(Math.floor(Math.random() * (questionList.length - 1)));
    } catch (error) {
      console.error(error);
    } finally {
      setIsloading(false);
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
      <Paper sx={{ padding: "20px" }}>
        <Grid item xs={12} sm={6}>
          <Container maxWidth="md">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={12}>
                <Chip color="default" size="small" label="level1" />{" "}
                <Chip color="default" size="small" label="missed > 10" />
              </Grid>
              <Grid item xs={12} sm={12}>
                <Typography sx={{ fontSize: "20px" }}>
                  {questionList[questionNum].contents}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={12}>
                <TextField
                  fullWidth
                  sx={{ maxWidth: "md" }}
                  id="outlined-basic"
                  size="small"
                  onChange={(e) => setAnswer(e.target.value)}
                  //label="Outlined"
                  variant="outlined"
                  value={answer}

                  helperText="ここに回答を入力"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // Enterキーでの自動送信を防ぐ
                      handleClick(); // Enterキーが押されたときに呼び出す関数
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <Button variant="contained" onClick={handleClick} startIcon>
                  回答する
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  onClick={startRecording}
                  startIcon={<BlockIcon />}
                >
                  声（未実装）
                </Button>
                <Button onClick={stopRecording}
                >🔸停止</Button>
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
              <hr />
              <Pokemon />
              <Demo />

              <Link href="/day">Day</Link>
              <hr />
              <Link href="redux-sample">redux-sample</Link>
            </Box>
          </Container>
        </Grid>


      </Paper>
      {/* </Grid>

          <Grid item sx={{ display: { xs: 'none', sm: 'block' } }} xs={4}>
            xxxxxx
          </Grid>
        </Grid>
      </Stack> */}
    </>
  );
}

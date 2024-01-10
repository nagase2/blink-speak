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
import "../css/shake.module.css";
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
import useQuestion from "../hooks/useQuestion";
import { get } from "http";
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

  // エラーの時に揺らす
  const [shake, setShake] = useState(false);

  const { getNewQuestion, getCurrentQuestion, isQuestionLoading } = useQuestion();

  // 問題はDBから取得できる様にあらかじめ用意しておく。
  // const questionList = [
  //   { id: "1", contents: "これはあなたのペンですか？", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "2", contents: "私は東京に住んでいます。", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "3", contents: "今日目覚ましを8時にセットしました", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "4", contents: "私は、名古屋出身です", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "5", contents: "今日は朝ごはんを食べましたか？", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "6", contents: "今日見た映画は、とても感動的でした。", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "7", contents: "もし私がカエルだったら草を食べていたでしょう", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "8", contents: "海外に行ったことはありますか？", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "9", contents: "どんな食べ物が好きですか？", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "10", contents: "沖縄は日本のどのあたりにありますか？", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "11", contents: "東京にはたくさんの外国人が訪れています。", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "12", contents: "コーディング規約に従うことは、チームのコラボレーションを助けます。", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "13", contents: "バグを修正するためにコードをデバッグしています。", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "14", contents: "プログラミング言語を学ぶために、オンラインコースを受講しています。", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "15", contents: "私はこの前のテストで１００点を取りました。", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "16", contents: "変数とは、データを格納するための重要な要素です。", level: 600, category: ["プログラミング", "IT"] },
  //   { id: "17", contents: "ユーザーインターフェースのデザインにはユーザビリティを考慮する必要があります。", level: 600, category: ["プログラミング", "IT"] },
  // ];

  useEffect(() => {
    // サーバサイドから問題を取得する
    const fn = async () => {
      // const response = await fetch(`api/ai/question`, {
      //   method: 'GET',
      //   // body: formData,
      // })
      const res = await getNewQuestion()

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
      try {
        if (audioFile) {
          // 送信データ
          let formData = new FormData()
          formData.append('file', audioFile)
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
        console.log("Error", error)
        alert("🐔" + error)
        setLoading(false)
      }
      setAudioFile(null)
    }
    fn()
  }, [audioFile])

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
        setRecording(true)
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
      getNewQuestion()

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
                  {
                    // FIXME: LoadingIconに変える
                    isQuestionLoading ? "問題を取得中(これはLoadingIconに変える）" :
                    getCurrentQuestion() ? getCurrentQuestion().contents : ""
                  }

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
                  // FIXME: 揺らせない・・・クラスを指定する方法が間違っている？？
                  className={shake ? 'shake-animation' : ''}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // Enterキーでの自動送信を防ぐ
                      handleAnswerClick(); // Enterキーが押されたときに呼び出す関数
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <Button variant="contained" onClick={handleAnswerClick} >
                  回答する
                </Button>
                {recording ?
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
                  </Button>
                }
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

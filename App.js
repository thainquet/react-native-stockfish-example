import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView, View, TouchableOpacity, Text, ScrollView } from 'react-native'
import WebView from 'react-native-webview'
import StaticServer from 'react-native-static-server';
import RNFS from 'react-native-fs';

export default function App() {
  const [url, setURL] = useState()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const server = new StaticServer(
      8089,
      RNFS.MainBundlePath + '/sf',
      { localOnly: true },
    )
    server.start()
      .then(url => setURL(url))
      .catch(console.log)

    return () => {
      if (server && server.isRunning()) {
        server.stop()
      }
    }
  }, [])
  const wv = useRef(null)

  const run = `
      var stockfish = new Worker('stockfish.asm.js')
      stockfish.onmessage = function(event) {
        let data = event.data ? event.data : event
        window.ReactNativeWebView.postMessage(data)
      };
      true;
    `;

  const handleLoadEnd = () => {
    wv.current.injectJavaScript(run)
  }

  return (
    <SafeAreaView style={{
      flex: 1
    }}>
      <View style={{
        flex: 1
      }}>
        <TouchableOpacity 
        style={{
          height: 20
        }}
        onPress={() => {
          if (!wv.current) return
          const msg = "go depth 10"
          wv.current.injectJavaScript(`
          setTimeout(function () {
            stockfish.postMessage("${msg}"); true;
          }, 100)
          true
          `)
        }}>
          <Text>
            Click to send "go depth 10"
          </Text>
        </TouchableOpacity>
        <ScrollView style={{
          flex: 1,
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          marginVertical: 10
        }}>
          {
            messages.length > 0 ? messages.map((item, id) => <Text key={id}>{item}</Text>) : <Text>No messages yet!</Text>
          }
        </ScrollView>
      </View>
      <View>
        {url && <WebView
          ref={ref => wv.current = ref}
          onMessage={(event) => {
            let temp = event.nativeEvent.data
            setMessages([...messages, temp])
          }}
          source={{
            uri: url
          }}
          originWhitelist={['*']}
          onLoadEnd={handleLoadEnd}
        />}
      </View>
    </SafeAreaView>
  )
}
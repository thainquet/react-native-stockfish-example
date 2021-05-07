import React, { useEffect, useRef, useState } from 'react'
import {SafeAreaView, View, TouchableOpacity, Text, Alert} from 'react-native'
import WebView from 'react-native-webview'

import StaticServer from 'react-native-static-server';
import RNFS from 'react-native-fs';

// path where files will be served from (index.html here)
let path = RNFS.MainBundlePath + '/sf';
let server = new StaticServer(8080, path);

export default function App() {
  const [url, setURL] = useState()
  useEffect(() => {
    (async () => {
      let url = await server.start()
      setURL(url)
    })()
    return () => server.stop()
  }, [])
  const wv = useRef(null)

  const run = `
      var stockfish = STOCKFISH();
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
        <Text>Works!</Text>
        <TouchableOpacity onPress={() => {
          if (!wv.current) return
          const msg = "go depth 1"
          wv.current.injectJavaScript(`
          setTimeout(function () {
            stockfish.postMessage("${msg}"); true;
          }, 100)
          true
          `)
        }}>
          <Text>
            Send "go depth 1"
          </Text>
        </TouchableOpacity>
      </View>
      <View>
        {url && <WebView 
        ref={ref => wv.current = ref}
          onMessage={(event) => {
            Alert.alert('SF', event.nativeEvent.data)
          }}
          // source={require('./wk/index.html')}
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
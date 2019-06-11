/**
 * @jest-environment jsdom
 */

import { WebSocket as mockWebSocket, Server, CloseOptions } from 'mock-socket'
import { LabGuiWebsocket, LabGuiWebsocketOptions, SendData } from '../src/lab-gui-websocket'

const getMockLabGuiWebsocket = (
  url: string,
  debug: boolean = false,
  options?: LabGuiWebsocketOptions
): LabGuiWebsocket => {
  const wsClient = new LabGuiWebsocket(url, {
    debug,
    websocketClass: mockWebSocket,
    ...options
  })
  return wsClient
}

interface CustomMessageEvent extends Event {
  data?: string
}

const getDelay = (time: number): Promise<{}> => {
  const delay = new Promise<{}>(function(resolve, reject) {
    setTimeout(function() {
      resolve('foo')
    }, time)
  })
  return delay
}

describe('Testing LabGuiWebsocket', () => {
  const url: string = 'ws://localhost:8080'
  // the diffentiation between object and string array is needed to to
  // a problem with  call signatures of union types
  // https://github.com/Microsoft/TypeScript/issues/7294
  let msgStringArray: string[]
  let msgObjectArray: object[]

  describe('imports and implementations', () => {
    it('LabGuiWebsocket class exists with that name', () => {
      expect(LabGuiWebsocket).toBeDefined()
    })

    it('default WebSocket of LabGuiWebsocket global WebSocket', () => {
      const wsClient = new LabGuiWebsocket(url)
      expect(wsClient.wsInstance).toBeInstanceOf(WebSocket)
    })

    it('WebSocket of LabGuiWebsocket is mocked properly', () => {
      const wsClient = getMockLabGuiWebsocket(url)
      expect(wsClient.wsInstance).toBeInstanceOf(mockWebSocket)
    })
  })

  describe('conncectivity with existing server', () => {
    beforeEach(() => {
      msgStringArray = []
      msgObjectArray = []
    })

    it('messages sent at connection start', done => {
      const mockServer = new Server(url)

      mockServer.on('connection', (socket: mockWebSocket) => {
        socket.send('connected')
      })

      const wsClient = getMockLabGuiWebsocket(url)

      wsClient.onmessage = (msg: MessageEvent) => {
        msgStringArray.push(msg.data)
      }
      expect(wsClient.connectionState).toBe(WebSocket.CONNECTING)
      setTimeout(() => {
        expect(wsClient.connectionState).toBe(WebSocket.OPEN)
        expect(msgStringArray.length).toBe(1)
        expect(msgStringArray[0]).toBe('connected')
        wsClient.close()
        mockServer.stop(done)
      }, 100)
    })

    it('messages sent as response (overwriting on message)', done => {
      const mockServer = new Server(url)

      // the cast of socket to any is needed due to a know bug in the type definitions of mock-socket
      // https://github.com/thoov/mock-socket/issues/224
      mockServer.on('connection', (socket: any) => {
        socket.on('message', (msg: string) => {
          socket.send(msg)
        })
      })

      const wsClient = getMockLabGuiWebsocket(url)

      wsClient.onopen = (event: Event) => {
        wsClient.send('onopen response from client')
      }

      wsClient.onmessage = (msg: MessageEvent) => {
        msgStringArray.push(msg.data)
      }

      setTimeout(() => {
        expect(msgStringArray.length).toBe(1)
        expect(msgStringArray).toEqual(['onopen response from client'])
        wsClient.close()
        mockServer.stop(done)
      }, 100)
    })

    it('messages sent as response, sending a string and using message_logic', done => {
      const mockServer = new Server(url)

      // the cast of socket to any is needed due to a know bug in the type definitions of mock-socket
      // https://github.com/thoov/mock-socket/issues/224
      mockServer.on('connection', (socket: any) => {
        socket.on('message', (msg: string) => {
          socket.send(msg)
        })
      })

      const wsClient = getMockLabGuiWebsocket(url)

      const messageObject = { status: 'test respone from string' }

      wsClient.onopen = (event: Event) => {
        wsClient.send('{"status": "test respone from string"}')
      }

      wsClient.message_logic = (msg: object) => {
        msgObjectArray.push(msg)
      }
      setTimeout(() => {
        expect(msgObjectArray.length).toBe(1)
        expect(msgObjectArray).toEqual([messageObject])
        wsClient.close()
        mockServer.stop(done)
      }, 100)
    })

    it('messages sent as response, sending a SendData object and using message_logic', done => {
      const mockServer = new Server(url)

      // the cast of socket to any is needed due to a know bug in the type definitions of mock-socket
      // https://github.com/thoov/mock-socket/issues/224
      mockServer.on('connection', (socket: any) => {
        socket.on('message', (msg: string) => {
          socket.send(msg)
        })
      })

      const messageObject = { status: 'test respone from SentData object' }

      const wsClient = getMockLabGuiWebsocket(url)

      wsClient.onopen = (event: Event) => {
        wsClient.send(messageObject)
      }

      wsClient.message_logic = (msg: object) => {
        msgObjectArray.push(msg)
      }
      setTimeout(() => {
        expect(msgObjectArray.length).toBe(1)
        expect(msgObjectArray).toEqual([messageObject])
        wsClient.close()
        mockServer.stop(done)
      }, 100)
    })
  })

  describe('reconnecting to server and timeout', () => {
    beforeEach(() => {
      msgStringArray = []
    })

    it('wait 3sec to create server and let the client autoconnect', done => {
      let mockServer: Server
      const wsClient = getMockLabGuiWebsocket(url)

      wsClient.onopen = (event: Event) => {
        msgStringArray.push('connected')
      }
      const delay = getDelay(3000)
      delay
        .then(() => {
          expect(wsClient.connectionState).toBe(WebSocket.CONNECTING)
          mockServer = new Server(url)
          setTimeout(() => {
            expect(wsClient.connectionState).toBe(WebSocket.OPEN)
            expect(msgStringArray.length).toBe(1)
            expect(msgStringArray[0]).toBe('connected')
            wsClient.close()
            mockServer.stop(done)
          }, 100)
        })
        .catch(() => 'just for linting')
    })

    it('wait for connection to time out', done => {
      // timeout only gets called because it isn't reset by clearTimeout, which is why it needs to be mocked
      jest.useFakeTimers()
      const spyLog = jest.spyOn(global.console, 'log').mockImplementation()
      const spyClear = jest.spyOn(global, 'clearTimeout').mockImplementation()
      let mockServer = new Server(url)
      const wsClient = getMockLabGuiWebsocket(url, true, {
        timeoutInterval: 10
      })
      jest.runOnlyPendingTimers()
      expect(spyLog).toHaveBeenCalled()
      expect(spyLog).toHaveBeenNthCalledWith(
        3,
        'LabGuiWebsocket',
        'connection-timeout',
        'ws://localhost:8080'
      )
      spyLog.mockRestore()
      spyClear.mockRestore()
      wsClient.close()
      mockServer.stop(done)
    })
  })
  describe('Wanted exceptions and dev helper functions', () => {
    const wsClient = getMockLabGuiWebsocket(url, false, {
      automaticOpen: false
    })

    it('get_message_object of not a JSON parsable string msg.data', () => {
      const exception = () => {
        const falsyMsgEvent = {
          data: '{"missing": "curly bracet to parse"'
        } as MessageEvent
        wsClient.get_message_object(falsyMsgEvent)
      }

      expect(exception).toThrow(new TypeError("The recived message couldn't be parsed to JSON."))
    })

    it('get_message_object of not string msg.data', () => {
      const exception = () => {
        const falsyMsgEvent = {
          data: 1
        } as MessageEvent
        wsClient.get_message_object(falsyMsgEvent)
      }

      expect(exception).toThrow(new TypeError("The recived message wasn't a string."))
    })

    it('send wrong formated data', () => {
      const exception = () => {
        wsClient.send(1 as any)
      }
      const errorMsg =
        'The data to be sent need to be a string or an object of form ' +
        '{"status": "control_status", "data":{...ui_settings} }'

      expect(exception).toThrow(new TypeError(errorMsg))
    })

    it('send before client is connect', () => {
      const exception = () => {
        wsClient.send('')
      }

      expect(exception).toThrow(new Error('INVALID_STATE_ERR : Pausing to reconnect websocket'))
    })

    it("message_logic wasn't overwritten", () => {
      const exception = () => {
        wsClient.message_logic({})
      }
      const errorMsg =
        'The method `message_logic` should be overwritten and used to ' +
        'do all the business logic on recieved messages objects'
      expect(exception).toThrow(errorMsg)
    })

    it("message_logic wasn't overwritten", () => {
      expect(wsClient.close()).toBe(false)
    })

    it('logging if debug is activated', () => {
      const debugClient = getMockLabGuiWebsocket(url, true, { automaticOpen: false })
      const spy = jest.spyOn(global.console, 'log').mockImplementation()
      const message = new MessageEvent('test', { data: '{ "test": 1 }' })
      debugClient.get_message_object(message)
      expect(spy).toHaveBeenCalled()
      expect(spy).toHaveBeenCalledWith('LabGuiWebsocket resolved message to msgObject: ', {
        test: 1
      })
      spy.mockRestore()
    })
  })
})

/**
 * This behaves like a WebSocket in every way, except if it fails to connect,
 * or it gets disconnected, it will repeatedly poll until it succesfully connects
 * again.
 *
 * It is API compatible, so when you have:
 *   ws = new WebSocket('ws://....');
 * you can replace with:
 *   ws = new LabUiWebsocketSettings('ws://....');
 *
 * The event stream will typically look like:
 *  onconnecting
 *  onopen
 *  onmessage
 *  onmessage
 *  onclose // lost connection
 *  onconnecting
 *  onopen  // sometime later...
 *  onmessage
 *  onmessage
 *  etc...
 *
 * It is API compatible with the standard WebSocket API.
 *
 * Original Code: https://github.com/joewalnes/reconnecting-websocket/
 * - Joe Walnes
 *
 * TypeScript implementation of Original Code version: https://github.com/daviddoran/typescript-reconnecting-websocket/
 * - David Doran
 */

/** Object style to be sent with LabUiWebsocket.send()
 */
export interface SendData {
  status: string
  data?: object
}

export interface LabUiWebsocketSettings extends LabUiWebsocketOptions {
  /** Protocolls to be used*/
  protocols: string[]
}

export interface LabUiWebsocketOptions {
  /** Whether this instance should log debug messages. */
  debug?: boolean

  /** Protocolls to be used*/
  protocols?: string[]

  /** WebSocket Class to create the WebSocket, thsi is mainly to mock it for testing*/
  websocketClass?: typeof WebSocket

  /** Whether or not the websocket should attempt to connect immediately upon instantiation. */
  automaticOpen?: boolean

  /** The number of milliseconds to delay before attempting to reconnect. */
  reconnectInterval?: number
  /** The maximum number of milliseconds to delay a reconnection attempt. */
  maxReconnectInterval?: number
  /** The rate of increase of the reconnect delay. Allows reconnect attempts to back off when problems persist. */
  reconnectDecay?: number

  /** The maximum time in milliseconds to wait for a connection to succeed before closing and retrying. */
  timeoutInterval?: number

  /** The maximum number of reconnection attempts to make. Unlimited if null. */
  maxReconnectAttempts?: number | null

  /** The binary type, possible values 'blob' or 'arraybuffer', default 'blob'. */
  binaryType?: 'blob' | 'arraybuffer'
}

export class LabUiWebsocket {
  private debugAll: boolean = false

  //The underlying WebSocket
  private ws: null | WebSocket = null
  private url: string

  private reconnectAttempts: number
  private readyState:
    | WebSocket['CONNECTING']
    | WebSocket['OPEN']
    | WebSocket['CLOSING']
    | WebSocket['CLOSED']
  private protocols: string[]
  private forcedClose: boolean = false
  private timedOut: boolean = false

  public onopen: (event: Event) => void = event => {}
  public onclose: (event: Event) => void = event => {}
  public onconnecting: () => void = () => {}
  public onerror: (event: Event) => void = event => {}

  // Default settings
  settings: LabUiWebsocketSettings = {
    debug: false,
    protocols: [],
    automaticOpen: true,
    reconnectInterval: 1000,
    maxReconnectInterval: 30000,
    reconnectDecay: 1.5,
    timeoutInterval: 2000,
    maxReconnectAttempts: null,
    binaryType: 'blob'
  }

  constructor(url: string, options: LabUiWebsocketOptions = {}) {
    // Overwrite and define settings with options if they exist.
    this.settings = { ...this.settings, ...options }
    /** The number of attempted reconnects since starting, or the last successful connection. Read only. */
    this.reconnectAttempts = 0

    this.url = url
    this.readyState = WebSocket.CONNECTING

    /**
     * A string indicating the name of the sub-protocol the server selected; this will be one of
     * the strings specified in the protocols parameter when creating the WebSocket object.
     * Read only.
     */
    this.protocols = this.settings.protocols

    // Whether or not to create a websocket upon instantiation
    if (this.settings.automaticOpen == true) {
      this.connect(false)
    }
  }

  public get wsInstance() {
    return this.ws
  }

  public get connectionState() {
    return this.readyState
  }

  public get_message_object(event: MessageEvent): void | object {
    if (typeof event.data === 'string') {
      try {
        let msg_object: object = JSON.parse(event.data)
        this.log('LabUiWebsocket', msg_object)
        return msg_object
      } catch (err) {
        this.log(err, 'Error parsing the message string: ', event.data)
        throw "The recived message couldn't be parsed to JSON."
      }
    } else {
      this.log("The server didn't pass a string: ", event.data)
      throw "The recived message wasn't a string."
    }
  }

  public onmessage(event: MessageEvent): void {
    this.log('the message event was ', event)
    const msg_object: void | object = this.get_message_object(event)
    this.log('the message object was ', event)
    if (msg_object) {
      this.message_logic(msg_object)
    }
  }

  public message_logic(msg_object: object): void {
    const error_msg =
      'The method `message_logic` should be overwritten and used to ' +
      'do all the business logic on recieved messages objects'
    throw error_msg
  }

  public connect(reconnectAttempt: boolean): void {
    if (this.settings.websocketClass) {
      this.ws = new this.settings.websocketClass(this.url, this.protocols)
    } else {
      this.ws = new WebSocket(this.url, this.protocols)
    }

    this.onconnecting()
    this.log('LabUiWebsocket', 'attempt-connect', this.url)

    var localWs = this.ws
    var timeout = setTimeout(() => {
      this.log('LabUiWebsocket', 'connection-timeout', this.url)
      this.timedOut = true
      localWs.close()
      this.timedOut = false
    }, this.settings.timeoutInterval)

    this.ws.onopen = (
      event: Event
      // { target: WebSocket }
    ) => {
      clearTimeout(timeout)
      this.log('LabUiWebsocket', 'onopen', this.url)
      this.readyState = WebSocket.OPEN
      reconnectAttempt = false
      this.onopen(event)
    }

    this.ws.onclose = (event: Event) => {
      clearTimeout(timeout)
      this.ws = null
      if (this.forcedClose) {
        this.readyState = WebSocket.CLOSED
        this.onclose(event)
      } else {
        this.readyState = WebSocket.CONNECTING
        this.onconnecting()
        if (!reconnectAttempt && !this.timedOut) {
          this.log('LabUiWebsocket', 'onclose', this.url)
          this.onclose(event)
        }
        setTimeout(() => {
          this.connect(true)
        }, this.settings.reconnectInterval)
      }
    }

    this.ws.onmessage = (event: MessageEvent): void => {
      this.log('LabUiWebsocket', 'onmessage', this.url, event.data)
      this.onmessage(event)
    }
    this.ws.onerror = (event: Event): void => {
      this.log('LabUiWebsocket', 'onerror', this.url, event)
      this.onerror(event)
    }
  }

  /**
   * Transmits data to the server over the WebSocket connection.
   *
   * @param data a text string or SendData to send to the server.
   */

  public send(data: SendData | string): void {
    let data_string: string
    const errror_msg =
      'The data to be sent need to be a string or an object of form ' +
      '{"status": "control_status", "data":{...ui_settings} }'
    if (typeof data === 'object') {
      data_string = JSON.stringify(data)
    } else if (typeof data === 'string') {
      data_string = data
    } else {
      throw errror_msg
    }
    if (this.ws) {
      this.log('LabUiWebsocket', 'send', this.url, data)
      return this.ws.send(data_string)
    } else {
      throw 'INVALID_STATE_ERR : Pausing to reconnect websocket'
    }
  }

  /**
   * Closes the WebSocket connection or connection attempt, if any.
   * If the connection is already CLOSED, this method does nothing.
   *Returns boolean, whether websocket was FORCEFULLY closed.
   */
  public close(): boolean {
    if (this.ws) {
      this.forcedClose = true
      this.ws.close()
      return true
    }
    return false
  }

  private log(...args: any[]): void {
    if (this.settings.debug || this.debugAll) {
      console.log(...args)
    }
  }
}

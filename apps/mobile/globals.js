import { Buffer } from 'buffer';
import 'react-native-get-random-values';

global.Buffer = Buffer;
global.process = require('process');
global.process.env.NODE_ENV = __DEV__ ? 'development' : 'production';
global.process.browser = true;

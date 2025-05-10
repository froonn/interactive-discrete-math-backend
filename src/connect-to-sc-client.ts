import { ScClient } from 'ts-sc-client'
import WebSocket from 'ws';
import 'dotenv/config';

export const scClient = new ScClient(new WebSocket(`ws://localhost:${process.env.VITE_MACHINE_PORT}`));
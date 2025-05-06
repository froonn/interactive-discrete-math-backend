import { ScClient } from 'ts-sc-client'
import 'dotenv/config';

export const scClient = new ScClient(`ws://localhost:${process.env.VITE_MACHINE_PORT}`);
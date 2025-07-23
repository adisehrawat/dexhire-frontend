// dexhire-exports.ts
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Cluster, PublicKey } from '@solana/web3.js';
import type { Dexhire } from '../../app/src/dexhire/idl';
import IDL from '../../app/src/dexhire/idl.json';

export const DEXHIRE_PROGRAM_ID = new PublicKey('341BQ4r4HykJSTSr9XKWeR2fDt9d5WCSUCn4VS4q7iyg');

export function getDexhireProgram(provider: AnchorProvider): Program<Dexhire> {
  return new Program(IDL as Dexhire, provider);
}

export function getDexhireProgramId(cluster: Cluster) {
    switch (cluster) {
      case "devnet":
      case "testnet":
      case "mainnet-beta":
      default:
        return DEXHIRE_PROGRAM_ID;
    }
  }
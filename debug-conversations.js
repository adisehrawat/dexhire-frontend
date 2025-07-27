// Debug script to test conversation fetching
const { Connection, PublicKey } = require('@solana/web3.js');
const { AnchorProvider, Program } = require('@coral-xyz/anchor');

// Mock wallet for testing
class MockWallet {
  constructor(publicKey) {
    this.publicKey = publicKey;
  }
  
  async signTransaction(tx) {
    return tx;
  }
  
  async signAllTransactions(txs) {
    return txs;
  }
}

const PROGRAM_ID = new PublicKey('341BQ4r4HykJSTSr9XKWeR2fDt9d5WCSUCn4VS4q7iyg');

const PDA = {
    clientProfile: (owner) =>
        PublicKey.findProgramAddressSync([Buffer.from('client'), owner.toBuffer()], PROGRAM_ID)[0],

    freelancerProfile: (owner) =>
        PublicKey.findProgramAddressSync([Buffer.from('freelancer'), owner.toBuffer()], PROGRAM_ID)[0],
};

async function debugConversations() {
    try {
        const connection = new Connection('https://api.devnet.solana.com');
        
        // Test with the user public key from your logs
        const userPublicKey = new PublicKey('D4qEcxJRdGKY2fXb5gfDuXpH8V7B2beCzocc7FHCcDTL');
        
        console.log('User public key:', userPublicKey.toString());
        
        const clientPDA = PDA.clientProfile(userPublicKey);
        const freelancerPDA = PDA.freelancerProfile(userPublicKey);
        
        console.log('Client PDA:', clientPDA.toString());
        console.log('Freelancer PDA:', freelancerPDA.toString());
        
        // Try to fetch proposals directly
        const proposalAccounts = await connection.getProgramAccounts(PROGRAM_ID, {
            filters: [
                {
                    memcmp: {
                        offset: 0,
                        bytes: 'proposal', // This might need to be adjusted based on discriminator
                    }
                }
            ]
        });
        
        console.log('Found proposal accounts:', proposalAccounts.length);
        
        proposalAccounts.forEach((account, index) => {
            console.log(`Proposal ${index + 1}:`, account.pubkey.toString());
            console.log('Data length:', account.account.data.length);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

debugConversations();

"use client";

import { useState, useEffect, useCallback } from "react";
import { ArgentWebWallet} from "@argent/webwallet-sdk";
import { RpcProvider } from "starknet";
import { notify } from "@/components/layout/notifier/Notifier";

const ARGENT_DUMMY_CONTRACT_ADDRESS = "0x07557a2fbe051e6327ab603c6d1713a91d2cfba5382ac6ca7de884d3278636d7";
const ARGENT_DUMMY_CONTRACT_ENTRYPOINT = "increase_number";

const provider = new RpcProvider({});

const argentWebWallet = ArgentWebWallet.init({
   appName: "Spotnet",
   environment: "mainnet",
   sessionParams: {
      allowedMethods: [
        // List of contracts/methods allowed to be called by the session key
         {
            contract: ARGENT_DUMMY_CONTRACT_ADDRESS,
            selector: ARGENT_DUMMY_CONTRACT_ENTRYPOINT,
         },
      ],
      validityDays: 90 // default
   },
   webwalletUrl: "https://web.argent.xyz",
});

export const useArgentWallet = (setWalletId) => {
   const [account, setAccount] = useState(undefined);
   const [isLoading, setIsLoading] = useState(false);
   const [txHash, setTxHash] = useState(undefined);

   useEffect(() => {
    argentWebWallet
            .connect()
            .then((response) => {
                              
               if (!response) {
                  console.log("Not connected");
                  notify("Not connected yet")
                  return;
               }

               console.log("Connected to Argent Web Wallet", response);
               const { account, callbackData, approvalTransactionHash, user } = response;

               if (account.getSessionStatus() !== "VALID") {
                  console.log("Session is not valid");
                  return;
               }

               setAccount(account);
               setWalletId(account.address)
               console.log("Callback data", callbackData); // -- custom_callback_string
               console.log("Approval transaction hash", approvalTransactionHash); // -- custom_callback_string
            })
            .catch((err) => {
               console.error("Failed to connect to Argent Web Wallet", err);
            });
   }, []);

   const submitTransaction = useCallback(async () => {
      if (!account) {
         console.error("Account not connected");
         return;
      }
      setIsLoading(true);
      try {
         const call = {
            contractAddress: account.address,
            
            calldata: [input_data],
         };
         const { resourceBounds: estimatedResourceBounds } = await account.estimateInvokeFee(call, {
            version: "0x3",
         });

         const resourceBounds = {
            ...estimatedResourceBounds,
            l1_gas: {
               ...estimatedResourceBounds.l1_gas,
               max_amount: "0x28",
            },
         };

         const { transaction_hash } = await account.execute(call, {
            version: "0x3",
            resourceBounds,
         });
         setTxHash(transaction_hash);
         await account.waitForTransaction(transaction_hash);
      } catch (error) {
         console.error("Transaction failed", error);
      } finally {
         setIsLoading(false);
      }
   }, [account]);


   const handleConnect = async () => {
    try {
       const response =  await argentWebWallet.requestConnection({
         //  callbackData: "custom_callback_data",
          approvalRequests: [
             {
                tokenAddress: "0x049D36570D4e46f48e99674bd3fcc84644DdD6b96F7C741B1562B82f9e004dC7",
                amount: BigInt("100000000000000000").toString(),
                // Your dapp contract
                spender: "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
             },
          ],
       });
               
       const { account: sessionAccount,  } = response
       console.log(sessionAccount);
       notify(sessionAccount)
       setAccount(sessionAccount);
       setWalletId(sessionAccount.address);
    } catch (err) {
       console.error("Handle connect error:", err);
    }
 };

   return { account, isLoading, txHash, handleConnect, submitTransaction };
};
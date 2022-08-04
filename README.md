# Traffic-Evasion-Dapp
Decentralized game application that interacts with a Solidity smart contract deployed on Polygon, allowing players to place a wager on their matches with MATIC via Metamask.

![image](https://user-images.githubusercontent.com/74326452/182949820-06c7330c-b34e-4ff4-9d6d-bcab1a55b24c.png)
## Features
- Metamask wallet connection via injected web3.ethereum object.
- Matchmaking with other players through client-server communication.
- Wager MATIC (ERC-20 Token compatible with Ethereum-based digital currencies) via Metamask wallet interface.
- Directly interacts with a smart contract that manages state, deployed on Polygon.
- Players attempt to evade randomly generated vehicle obstacles to reach the finish line for points.
- Player and opponent live score counters via socket events.
- 90-second timer that counts down the match duration, after which funds will be disbursed to players according to the outcome.

## Dependencies
- Socket.IO
- Express.js
- Web3.js
- Solidity
- Alchemy/Hardhat (for smart contract deployment)

## Contract Interaction Examples
![image](https://user-images.githubusercontent.com/74326452/182949518-9591d14f-c043-45de-9c8e-4b900344e7ea.png) ![image](https://user-images.githubusercontent.com/74326452/182951149-ed19c9fe-1c0c-4318-ab4b-b677b53ecaf3.png)

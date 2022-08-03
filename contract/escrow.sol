// SPDX-License-Identifier: None

pragma solidity >=0.8.9;

contract Escrow {   
    // Defining states.
    enum playerState { INIT, WAITING, VICTORY, DEFEAT, TIE, FIN}
    enum matchState { WAITING_IN_LOBBY, MATCH_IN_PROGRESS, MATCH_END, MATCH_ABORTED }

    // Structs for maintaining match information.
    struct Player {
        string id;              // Pass in socket_id as an identifer here.
        playerState state;      // State of the player defined by above enum.
        address payable addr;   // Wallet address of the player.
    }   

    struct Match {
        uint256 bet;            // Wager of the match agreed to by both parties.
        matchState state;       // State of the game defined by above enum.
        Player p1;              // First player to join.
        Player p2;              // Second player to join.
    }

    // Create array to track all matches.
    Match[] matches;

    // Only allow socket ids that do not exist in the ongoing matches array already.
    modifier unique_id(string memory p_id) {
        for(uint i = 0; i < matches.length; i++) {
            require(keccak256(abi.encodePacked(matches[i].p1.id)) != keccak256(abi.encodePacked(p_id)));
            require(keccak256(abi.encodePacked(matches[i].p2.id)) != keccak256(abi.encodePacked(p_id)));
        }
        _;
    }

    // Initialize a new match. Player 1 will now wait for player 2.     
    function createMatch(string calldata p1_id) external payable unique_id(p1_id) {
        Player memory p1 = Player(p1_id, playerState.WAITING, payable(msg.sender));
        Player memory p2 = Player("", playerState.INIT, payable(address(0)));
        Match memory m = Match(msg.value, matchState.WAITING_IN_LOBBY, p1, p2);
        matches.push(m);
    }

    // Join an existing match. Player 1 and player 2 will now begin.
    function joinMatch(string calldata p1_id, string calldata p2_id) external payable unique_id(p2_id) {
        for(uint256 i = 0; i < matches.length; i++) {
            if(keccak256(abi.encodePacked(matches[i].p1.id)) == keccak256(abi.encodePacked(p1_id))) {
                require(matches[i].state == matchState.WAITING_IN_LOBBY && matches[i].bet == msg.value);
                require(matches[i].p1.state == playerState.WAITING && matches[i].p2.state == playerState.INIT);

                matches[i].p2.id = p2_id;
                matches[i].p2.state = playerState.WAITING;
                matches[i].p2.addr = payable(msg.sender);

                matches[i].state = matchState.MATCH_IN_PROGRESS;
                break;
            }
        }
    }

    // Victor calls this function to receive winnings.
    function victory(string calldata p_id) external payable {
        for(uint256 i = 0; i < matches.length; i++) {
            bool fin = false;
            if(keccak256(abi.encodePacked(matches[i].p1.id)) == keccak256(abi.encodePacked(p_id))) {
                require(matches[i].state == matchState.MATCH_IN_PROGRESS);
                matches[i].p1.state = playerState.VICTORY; 
                matches[i].p2.state = playerState.DEFEAT; 
                fin = true;
            }
            if(keccak256(abi.encodePacked(matches[i].p2.id)) == keccak256(abi.encodePacked(p_id))) {
                require(matches[i].state == matchState.MATCH_IN_PROGRESS);
                matches[i].p1.state = playerState.DEFEAT; 
                matches[i].p2.state = playerState.VICTORY;
                fin = true;
            }
            if(fin) {
                matches[i].state = matchState.MATCH_END;
                payoutWin(i, p_id);
                break;
            }
        }
    }

    // Both players call this function in the event of a tie to receive initial bet back.
    function tie(string calldata p_id) external payable {
        for(uint256 i = 0; i < matches.length; i++) {
            if(keccak256(abi.encodePacked(matches[i].p1.id)) == keccak256(abi.encodePacked(p_id))) {    
                require(matches[i].state == matchState.MATCH_IN_PROGRESS || matches[i].state == matchState.MATCH_END);
                require(matches[i].p1.state == playerState.WAITING);
                matches[i].p1.state = playerState.TIE;
                matches[i].state = matchState.MATCH_END;
                payoutTie(i, p_id);
                break;
            }
            if(keccak256(abi.encodePacked(matches[i].p2.id)) == keccak256(abi.encodePacked(p_id))) {
                require(matches[i].state == matchState.MATCH_IN_PROGRESS || matches[i].state == matchState.MATCH_END);
                require(matches[i].p2.state == playerState.WAITING);
                matches[i].p2.state = playerState.TIE;
                matches[i].state = matchState.MATCH_END;
                payoutTie(i, p_id);
                break;
            }
        }
    }

    // Sends funds to winner and closes match immediately.
    function payoutWin(uint256 i, string memory p_id) internal {
        require(matches[i].state == matchState.MATCH_END);
        
        if(keccak256(abi.encodePacked(matches[i].p1.id)) == keccak256(abi.encodePacked(p_id))) {    
            require(matches[i].p1.state == playerState.VICTORY);
            matches[i].p1.addr.transfer(matches[i].bet * 2);
        }
        if(keccak256(abi.encodePacked(matches[i].p2.id)) == keccak256(abi.encodePacked(p_id))) {    
            require(matches[i].p2.state == playerState.VICTORY);
            matches[i].p2.addr.transfer(matches[i].bet * 2);
        }
        matches[i] = matches[matches.length - 1];
        matches.pop();
    }

    // Waits for both players to receive initial bet back before closing match.
    function payoutTie(uint256 i, string memory p_id) internal {
        require(matches[i].state == matchState.MATCH_END);

        if(keccak256(abi.encodePacked(matches[i].p1.id)) == keccak256(abi.encodePacked(p_id))) {    
            require(matches[i].p1.state == playerState.TIE);
            matches[i].p1.state = playerState.FIN;
            matches[i].p1.addr.transfer(matches[i].bet);
        }
        if(keccak256(abi.encodePacked(matches[i].p2.id)) == keccak256(abi.encodePacked(p_id))) {    
            require(matches[i].p2.state == playerState.TIE);
            matches[i].p2.state = playerState.FIN;
            matches[i].p2.addr.transfer(matches[i].bet);
        }
        if(matches[i].p1.state == playerState.FIN && matches[i].p2.state == playerState.FIN) {
            matches[i] = matches[matches.length - 1];
            matches.pop();
        }
    }

    // If lobby times out, refund player 1 and remove the match from the array. 
    function abort(string calldata p1_id) external payable {
        for(uint256 i = 0; i < matches.length; i++) {
            if(keccak256(abi.encodePacked(matches[i].p1.id)) == keccak256(abi.encodePacked(p1_id))) {    
                require(matches[i].state == matchState.WAITING_IN_LOBBY);
                matches[i].state = matchState.MATCH_ABORTED;
                matches[i].p1.addr.transfer(matches[i].bet);

                matches[i] = matches[matches.length - 1];
                matches.pop();
                break;
            }
        }
    } 

    function getMatchBet(uint256 idx) view public returns(uint256) {
        return matches[idx].bet;
    }

    function getMatchState(uint256 idx) view public returns(string memory) {
        if(matches[idx].state == matchState.WAITING_IN_LOBBY) { return "WAITING_IN_LOBBY"; }
        else if(matches[idx].state == matchState.MATCH_IN_PROGRESS) { return "MATCH_IN_PROGRESS"; }
        else if(matches[idx].state == matchState.MATCH_END) { return "MATCH_END"; }
        else if(matches[idx].state == matchState.MATCH_ABORTED) { return "MATCH_ABORTED"; }
        else { return "ERROR"; }
    }
    
    function getPlayer1ID(uint256 idx) view public returns(string memory) {
        return matches[idx].p1.id;
    }

    function getPlayer2ID(uint256 idx) view public returns(string memory) {
        return matches[idx].p2.id;
    }

    function getPlayer1State(uint256 idx) view public returns(string memory) {
        if(matches[idx].p1.state == playerState.INIT) { return "INIT"; }
        else if(matches[idx].p1.state == playerState.WAITING) { return "WAITING"; }
        else if(matches[idx].p1.state == playerState.VICTORY) { return "VICTORY"; }
        else if(matches[idx].p1.state == playerState.DEFEAT) { return "DEFEAT"; }
        else if(matches[idx].p1.state == playerState.TIE) { return "TIE"; }
        else if(matches[idx].p1.state == playerState.FIN) { return "FIN"; }    
        else { return "ERROR"; }
    }

    function getPlayer2State(uint256 idx) view public returns(string memory) {
        if(matches[idx].p2.state == playerState.INIT) { return "INIT"; }
        else if(matches[idx].p2.state == playerState.WAITING) { return "WAITING"; }
        else if(matches[idx].p2.state == playerState.VICTORY) { return "VICTORY"; }
        else if(matches[idx].p2.state == playerState.DEFEAT) { return "DEFEAT"; }
        else if(matches[idx].p2.state == playerState.TIE) { return "TIE"; }
        else if(matches[idx].p2.state == playerState.FIN) { return "FIN"; }    
        else { return "ERROR"; }
    }
}
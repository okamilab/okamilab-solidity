pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "./ERC721FundableEscrow.sol";
import "./ERC721ReceivableEscrow.sol";

contract ERC721FullEscrow is ERC721FundableEscrow, ERC721ReceivableEscrow {
    constructor(IERC721 token) public ERC721FundableEscrow(token) {
        // solhint-disable-previous-line no-empty-blocks
    }
}
pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol";
import "./IERC721Escrow.sol";

contract ERC721ReceivableEscrow is IERC721Escrow, IERC721Receiver {
    event Received(address indexed operator, address indexed from, uint256 tokenId, bytes data);

    function onERC721Received(address operator, address from, uint256 tokenId, bytes memory data)
        public returns (bytes4)
    {
        _deposit(from, tokenId);
        emit Received(operator, from, tokenId, data);

        return this.onERC721Received.selector;
    }
}
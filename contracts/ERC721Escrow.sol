pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC721/IERC721.sol";
import "./IERC721Escrow.sol";

contract ERC721Escrow is IERC721Escrow {
    IERC721 internal _token;
    mapping(uint256 => address) internal _owners;

    modifier exists(uint256 tokenId) {
        require(_owners[tokenId] != address(0), "Escrow doesn't exist");
        _;
    }

    modifier onlyOwner(uint256 tokenId) {
        require(msg.sender == _owners[tokenId], "Only owner can execute");
        _;
    }

    modifier notOwner(uint256 tokenId) {
        require(msg.sender != _owners[tokenId], "Owner cannot execute");
        _;
    }

    constructor(IERC721 token) internal {
        _token = token;
    }

    function _deposit(address from, uint256 tokenId) internal {
        require(_token.ownerOf(tokenId) == address(this), "Fraud detected");
        require(msg.sender == address(_token), "Wrong token contract");

        _owners[tokenId] = from;
        emit Deposited(from, tokenId);
    }

    function _withdraw(address to, uint256 tokenId) internal {
        _owners[tokenId] = address(0);
        _token.safeTransferFrom(address(this), msg.sender, tokenId);
        emit Withdrawn(to, tokenId);
    }
}
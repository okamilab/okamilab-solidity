pragma solidity ^0.5.2;

contract IERC721Escrow {
    event Deposited(address indexed from, uint256 tokenId);
    event Withdrawn(address indexed to, uint256 tokenId);

    function _deposit(address from, uint256 tokenId) internal;
}
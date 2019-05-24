pragma solidity ^0.5.2;

import "./ERC721Escrow.sol";

contract ERC721FundableEscrow is ERC721Escrow {
    enum State { Init, Active, Funded, Refunded, Closed }

    event Activated(address indexed owner, uint256 tokenId, uint256 weiAmount);
    event Destructed(address indexed owner, uint256 tokenId);
    event Funded(address indexed payee, uint256 tokenId, uint256 weiAmount);
    event Refunded(address indexed payee, uint256 tokenId, uint256 weiAmount);
    event Claimed(address indexed to, uint256 tokenId);

    mapping(uint256 => address) private _lenders;
    mapping(uint256 => State) private _states;
    mapping(uint256 => uint256) private _values;

    modifier onlyLender(uint256 tokenId) {
        require(msg.sender == _lenders[tokenId], "Only lender can execute");
        _;
    }

    constructor(IERC721 token) public ERC721Escrow(token) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function state(uint256 tokenId) public view returns (State) {
        return _states[tokenId];
    }

    function activate(uint256 tokenId, uint256 weiAmount) public exists(tokenId) onlyOwner(tokenId) {
        require(_states[tokenId] == State.Init, "Already activated");
        require(weiAmount != 0, "Amount should be greater than zero");

        _states[tokenId] = State.Active;
        _values[tokenId] = weiAmount;
        emit Activated(msg.sender, tokenId, weiAmount);
    }

    function destruct(uint256 tokenId) public exists(tokenId) onlyOwner(tokenId) {
        require(_states[tokenId] == State.Init ||
            _states[tokenId] == State.Active ||
            _states[tokenId] == State.Refunded, "Should be active or refunded");

        _states[tokenId] = State.Closed;
        emit Destructed(msg.sender, tokenId);

        _withdraw(msg.sender, tokenId);
    }

    function fund(uint256 tokenId) public payable exists(tokenId) notOwner(tokenId) {
        require(_states[tokenId] == State.Active, "Should be active");
        uint256 amount = msg.value;
        require(amount == _values[tokenId], "Value should be equal token value");

        _lenders[tokenId] = msg.sender;
        _states[tokenId] = State.Funded;
        emit Funded(msg.sender, tokenId, amount);

        _forwardFunds(_owners[tokenId]);
    }

    function refund(uint256 tokenId) public payable exists(tokenId) onlyOwner(tokenId) {
        require(_states[tokenId] == State.Funded, "Should be funded");
        uint256 amount = msg.value;
        require(amount == _values[tokenId], "Value should be equal token value");

        _states[tokenId] = State.Refunded;
        emit Refunded(msg.sender, tokenId, amount);

        _forwardFunds(_lenders[tokenId]);
    }

    function claim(uint256 tokenId) public exists(tokenId) onlyLender(tokenId) {
        require(_states[tokenId] == State.Funded, "Should be funded");

        _states[tokenId] = State.Closed;
        emit Claimed(msg.sender, tokenId);

        _withdraw(msg.sender, tokenId);
    }

    function _forwardFunds(address to) internal {
        address(uint160(to)).transfer(msg.value);
    }
}
const { BN, expectEvent, shouldFail, balance } = require('openzeppelin-test-helpers');

const ERC721Mock = artifacts.require('./ERC721Mock.sol');
const ERC721FullEscrow = artifacts.require('./ERC721FullEscrow.sol');

contract.only('ERC721FullEscrow', accounts => {
  let tokenId = new BN('0');

  describe('Activate', () => {
    before(async () => {
      tokenId = new BN('933');
      this.token = await ERC721Mock.new({ from: accounts[0] });
      this.escrow = await ERC721FullEscrow.new(this.token.address, { from: accounts[0] });
    });

    it('reverts when amount is zero', async () => {
      await shouldFail.reverting(this.escrow.activate(tokenId, 0, { from: accounts[0] }));
    });

    it('reverts when escrow not exist', async () => {
      tokenId = new BN('298');
      await shouldFail.reverting(this.escrow.activate(tokenId, 1, { from: accounts[0] }));
    });

    it('reverts when executes by not owner', async () => {
      tokenId = new BN('928');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId);

      await shouldFail.reverting(this.escrow.activate(tokenId, 1, { from: accounts[1] }));
    });

    it('reverts when state is not init', async () => {
      tokenId = new BN('333');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId);
      await this.escrow.activate(tokenId, 100, { from: accounts[0] });

      await shouldFail.reverting(this.escrow.activate(tokenId, 1, { from: accounts[0] }));
    });

    it('should activate', async () => {
      tokenId = new BN('3881');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId);
      
      const { logs } = await this.escrow.activate(tokenId, 100, { from: accounts[0] });
      expectEvent.inLogs(logs, 'Activated', {
        owner: accounts[0],
        tokenId: new BN('3881'),
        weiAmount: new BN('100')
      });
    });
  });

  describe('Destruct', function () {
    before(async () => {
      tokenId = new BN('42');
      this.token = await ERC721Mock.new({ from: accounts[0] });
      this.escrow = await ERC721FullEscrow.new(this.token.address, { from: accounts[0] });
    });

    it('reverts when escrow not exist', async () => {
      tokenId = new BN('812');
      await shouldFail.reverting(this.escrow.destruct(tokenId, { from: accounts[0] }));
    });

    it('reverts when executes by not owner', async () => {
      tokenId = new BN('903');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId);

      await shouldFail.reverting(this.escrow.destruct(tokenId, { from: accounts[1] }));
    });

    it('reverts when escrow funded', async () => {
      tokenId = new BN('5034');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId);
      await this.escrow.activate(tokenId, 1000, { from: accounts[0] });
      await this.escrow.fund(tokenId, { from: accounts[1], value: 1000 });

      await shouldFail.reverting(this.escrow.destruct(tokenId, { from: accounts[1] }));
    });

    it('withdraw when escrow is not active yet', async () => {
      tokenId = new BN('143');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId, { from: accounts[0] });

      const { logs } = await this.escrow.destruct(tokenId, { from: accounts[0] });
      expectEvent.inLogs(logs, 'Destructed', {
        owner: accounts[0],
        tokenId: new BN('143')
      });

      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
    });

    it('withdraw when escrow is not funded yet', async () => {
      tokenId = new BN('13');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId, { from: accounts[0] });
      await this.escrow.activate(tokenId, 1000, { from: accounts[0] });

      await this.escrow.destruct(tokenId, { from: accounts[0] });

      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
    });

    it('withdraw when escrow is refunded', async () => {
      tokenId = new BN('623');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId, { from: accounts[0] });
      await this.escrow.activate(tokenId, 1000, { from: accounts[0] });
      await this.escrow.fund(tokenId, { from: accounts[1], value: 1000 });
      await this.escrow.refund(tokenId, { from: accounts[0], value: 1000 });

      await this.escrow.destruct(tokenId, { from: accounts[0] });

      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
    });
  });

  describe('Fund', function () {
    before(async () => {
      tokenId = new BN('416');
      this.token = await ERC721Mock.new({ from: accounts[0] });
      this.escrow = await ERC721FullEscrow.new(this.token.address, { from: accounts[0] });
    });

    it('reverts when escrow not exist', async () => {
      tokenId = new BN('812');
      await shouldFail.reverting(this.escrow.fund(tokenId, { from: accounts[0], value: 1 }));
    });

    it('reverts when owner funds', async () => {
      tokenId = new BN('221');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId, { from: accounts[0] });

      await shouldFail.reverting(this.escrow.fund(tokenId, { from: accounts[0], value: 1 }));
    });

    it('reverts when state is not active', async () => {
      tokenId = new BN('5021');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId, { from: accounts[0] });

      await shouldFail.reverting(this.escrow.fund(tokenId, { from: accounts[1], value: 1 }));
    });

    it('reverts when amount is not match', async () => {
      tokenId = new BN('12331');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId, { from: accounts[0] });
      await this.escrow.activate(tokenId, 1000, { from: accounts[0] });

      await shouldFail.reverting(this.escrow.fund(tokenId, { from: accounts[1], value: 1 }));
    });

    it('should fund', async () => {
      tokenId = new BN('9648');
      await this.token.mint(accounts[0], tokenId, { from: accounts[0] });
      (await this.token.ownerOf(tokenId)).should.equal(accounts[0]);
      await this.token.safeTransferFrom(accounts[0], this.escrow.address, tokenId, { from: accounts[0] });
      await this.escrow.activate(tokenId, 1000, { from: accounts[0] });
      const balanceTracker = await balance.tracker(accounts[0]);

      const { logs } = await this.escrow.fund(tokenId, { from: accounts[1], value: 1000 });
      expectEvent.inLogs(logs, 'Funded', {
        payee: accounts[1],
        tokenId: new BN('9648'),
        weiAmount: new BN('1000')
      });

      (await balanceTracker.delta()).should.be.bignumber.equal('1000');
    });
  });
});

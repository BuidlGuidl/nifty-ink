// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Faucet {
    address payable public owner;
    address public authorizedWithdrawer;
    uint256 public maxWithdrawal = 0.01 ether;
    uint256 public lockTime = 1 hours;  // Updated lockTime to 1 hour

    mapping(address => uint256) nextAccessTime;

    event Withdrawal(address indexed to, uint256 amount);
    event Deposited(address indexed by, uint256 amount);
    event LockTimeChanged(uint256 newLockTime);
    event MaxWithdrawalChanged(uint256 newMaxWithdrawal);
    event AuthorizedWithdrawerChanged(address newAuthorizedWithdrawer);

    constructor() {
        owner = payable(msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function.");
        _;
    }

    modifier onlyAuthorizedWithdrawer() {
        require(msg.sender == authorizedWithdrawer, "Only authorized withdrawer can call this function.");
        _;
    }

    function withdraw(address _to) external onlyAuthorizedWithdrawer {
        require(_to.balance < 0.01 ether, "Your balance is too high.");
        require(address(this).balance >= maxWithdrawal, "Insufficient balance in the faucet.");
        require(block.timestamp >= nextAccessTime[_to], "Insufficient time elapsed since last withdrawal - try again later.");

        nextAccessTime[_to] = block.timestamp + lockTime;

        payable(_to).transfer(maxWithdrawal);
        emit Withdrawal(_to, maxWithdrawal);
    }

    // Fallback function to receive ether
    receive() external payable {}

    // Function to allow any user to refill the faucet
    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0.");
        emit Deposited(msg.sender, msg.value);
    }

    // Function to allow the owner to withdraw funds from the contract
    function withdrawFunds(uint256 _amount) external onlyOwner {
        require(address(this).balance >= _amount, "Insufficient balance in the contract.");
        owner.transfer(_amount);
    }

    // Function to allow the owner to change the lockTime
    function setLockTime(uint256 _lockTime) external onlyOwner {
        lockTime = _lockTime;
        emit LockTimeChanged(_lockTime);
    }

    // Function to allow the owner to change the maxWithdrawal
    function setMaxWithdrawal(uint256 _maxWithdrawal) external onlyOwner {
        maxWithdrawal = _maxWithdrawal;
        emit MaxWithdrawalChanged(_maxWithdrawal);
    }

    // Function to allow the owner to set the authorized withdrawer
    function setAuthorizedWithdrawer(address _authorizedWithdrawer) external onlyOwner {
        authorizedWithdrawer = _authorizedWithdrawer;
        emit AuthorizedWithdrawerChanged(_authorizedWithdrawer);
    }
}

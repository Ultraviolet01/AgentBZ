// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AgentBazaar HederaVault
 * @notice Non-custodial on-chain vault for AI agent execution on Hedera.
 * Buyers deposit HBAR into their isolated vault balance.
 * AgentBazaar operator settles per-agent execution deductions.
 */
contract HederaVault {
    address public owner;
    
    // Mapping from buyer EVM/Hedera address to vault balance in tinybars/wei
    mapping(address => uint256) public balances;
    
    // Total deposits and deductions tracked on-chain
    uint256 public totalDeposited;
    uint256 public totalDeducted;

    event Deposited(address indexed buyer, uint256 amount, uint256 newBalance);
    event Deducted(address indexed buyer, address indexed recipient, uint256 amount, uint256 remainingBalance);
    event Withdrawn(address indexed buyer, uint256 amount, uint256 remainingBalance);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "HederaVault: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /**
     * @notice Deposit HBAR into buyer's isolated vault
     */
    function deposit() external payable {
        require(msg.value > 0, "HederaVault: deposit amount must be > 0");
        
        balances[msg.sender] += msg.value;
        totalDeposited += msg.value;

        emit Deposited(msg.sender, msg.value, balances[msg.sender]);
    }

    /**
     * @notice Deposit on behalf of another buyer address (e.g. platform top-up)
     */
    function depositFor(address buyer) external payable {
        require(buyer != address(0), "HederaVault: invalid buyer address");
        require(msg.value > 0, "HederaVault: deposit amount must be > 0");
        
        balances[buyer] += msg.value;
        totalDeposited += msg.value;

        emit Deposited(buyer, msg.value, balances[buyer]);
    }

    /**
     * @notice Deduct HBAR from buyer's vault upon verified agent execution
     * @param buyer The buyer whose vault is being deducted
     * @param amount The fee amount in tinybars/wei
     * @param recipient The builder or fee collector payout address
     */
    function deduct(
        address buyer,
        uint256 amount,
        address payable recipient
    ) external onlyOwner {
        require(buyer != address(0), "HederaVault: invalid buyer");
        require(recipient != address(0), "HederaVault: invalid recipient");
        require(amount > 0, "HederaVault: amount must be > 0");
        require(balances[buyer] >= amount, "HederaVault: insufficient vault balance");
        require(address(this).balance >= amount, "HederaVault: insufficient contract balance");

        balances[buyer] -= amount;
        totalDeducted += amount;

        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "HederaVault: failed to transfer payout to recipient");

        emit Deducted(buyer, recipient, amount, balances[buyer]);
    }

    /**
     * @notice Allow buyers to withdraw their unspent vault balance
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external {
        require(amount > 0, "HederaVault: withdraw amount must be > 0");
        require(balances[msg.sender] >= amount, "HederaVault: insufficient balance");
        require(address(this).balance >= amount, "HederaVault: insufficient contract liquidity");

        balances[msg.sender] -= amount;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "HederaVault: withdraw transfer failed");

        emit Withdrawn(msg.sender, amount, balances[msg.sender]);
    }

    /**
     * @notice Query available balance for a buyer
     */
    function getBalance(address buyer) external view returns (uint256) {
        return balances[buyer];
    }

    /**
     * @notice Transfer contract ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "HederaVault: new owner is zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
        totalDeposited += msg.value;
        emit Deposited(msg.sender, msg.value, balances[msg.sender]);
    }
}

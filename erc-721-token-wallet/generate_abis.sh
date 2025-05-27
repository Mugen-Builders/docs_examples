#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

# Output directory for TypeScript files
TS_DIR="src/wallet/abi"

# Temporary directory for compilation output
TEMP_DIR="temp_solc_output"

# Create output and temporary directories
mkdir -p "$TS_DIR"
mkdir -p "$TEMP_DIR"

# Function to generate ABI and export as a TypeScript variable
generate_abi() {
    local sol_file="$1"
    local contract_name="$2"
    local output_file="$TS_DIR/${contract_name}Abi.ts"

    echo "Compiling $sol_file..."

    # Compile the contract in the temporary directory
    npx solcjs --abi "$sol_file" --base-path . --include-path node_modules/ --output-dir "$TEMP_DIR"

    # Find the generated ABI file
    abi_file=$(find "$TEMP_DIR" -name "*_${contract_name}.abi")

    if [ ! -f "$abi_file" ]; then
        echo "Error: ABI file not found for $contract_name"
        return 1
    fi

    # Read the ABI content
    abi=$(cat "$abi_file")

    echo "Extracted ABI for $contract_name"

    # Create a TypeScript file with exported ABI
    echo "export const ${contract_name}Abi = $abi as const;" > "$output_file"

    echo "Generated ABI for $contract_name"
    echo "----------------------"
}

# Generate ABIs
generate_abi "node_modules/@cartesi/rollups/contracts/dapp/CartesiDApp.sol" "CartesiDApp"
generate_abi "node_modules/@cartesi/rollups/contracts/portals/EtherPortal.sol" "EtherPortal"

# Clean up the temporary directory
rm -rf "$TEMP_DIR"

echo "ABI generation complete"
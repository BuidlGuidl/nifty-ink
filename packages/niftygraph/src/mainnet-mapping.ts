import { BigInt, Address, ipfs, json, JSONValueKind, log } from "@graphprotocol/graph-ts"
import {
  NiftyMain,
  mintedInk,
  Transfer
} from "../generated/NiftyMain/NiftyMain"
import { Token, TokenTransfer } from "../generated/schema"

export function handleTransfer(event: Transfer): void {

  let tokenId = event.params.tokenId.toString()

  let token = Token.load(tokenId)

  if (token !== null) {
    token.owner = event.params.to
    token.save()
  }

  let transfer = new TokenTransfer(event.transaction.hash.toHex())

  transfer.token = tokenId
  transfer.to = event.params.to
  transfer.from = event.params.from
  transfer.createdAt = event.block.timestamp
  transfer.network = 'mainnet'

  transfer.save()
}

export function handleMintedOnMain (event: mintedInk): void {

  let token = new Token(event.params.id.toString())

  token.ink = event.params.inkUrl
  token.jsonUrl = event.params.jsonUrl
  token.owner = event.params.to
  token.createdAt = event.block.timestamp
  token.network = "mainnet"
  token.upgradeTransfer = event.transaction.hash.toHex()

  token.save()
}

import { BigInt, Address, ipfs, json, JSONValueKind, log, TypedMap } from "@graphprotocol/graph-ts"
import {
  NiftyInk,
  newInk,
  SetPriceCall,
  SetPriceFromSignatureCall,
  newInkPrice
} from "../generated/NiftyInk/NiftyInk"
import {
  NiftyToken,
  mintedInk,
  Transfer,
  SetTokenPriceCall,
  boughtInk,
  newTokenPrice,
} from "../generated/NiftyToken/NiftyToken"
import {
  NiftyMediator,
  newPrice,
  tokenSentViaBridge
} from "../generated/NiftyMediator/NiftyMediator"
import {
  liked
} from "../generated/Liker/Liker";
import { Ink, Artist, Token, TokenTransfer, Sale, RelayPrice, Total, MetaData, InkLookup, Like, User, DailyTotal } from "../generated/schema"


 function updateMetaData(metric: String, value: String): void {
   let metaData = new MetaData(metric)
   metaData.value = value
   metaData.save()
 }

 function incrementTotal(metric: String, timestamp: BigInt, value: BigInt): void {

    let stats = Total.load("latest")
    let day = (timestamp / BigInt.fromI32(86400)) * BigInt.fromI32(86400)

    if (stats) {
      if (stats.day != day) {
        let yesterdayStats = stats
        yesterdayStats.id = stats.day.toString()
        yesterdayStats.save()
        stats.id = "latest"
      }
    } else if (stats === null) {
      stats = new Total("latest")
      stats.inks = BigInt.fromI32(0)
      stats.tokens = BigInt.fromI32(0)
      stats.upgrades = BigInt.fromI32(0)
      stats.sales = BigInt.fromI32(0)
      stats.saleValue = BigInt.fromI32(0)
      stats.artists = BigInt.fromI32(0)
      stats.users = BigInt.fromI32(0)
    }

    let dailyStats = DailyTotal.load(day.toString())

    if (dailyStats === null) {
      dailyStats = new DailyTotal(day.toString())
      dailyStats.day = day
      dailyStats.inks = BigInt.fromI32(0)
      dailyStats.tokens = BigInt.fromI32(0)
      dailyStats.upgrades = BigInt.fromI32(0)
      dailyStats.sales = BigInt.fromI32(0)
      dailyStats.saleValue = BigInt.fromI32(0)
      dailyStats.artists = BigInt.fromI32(0)
      dailyStats.users = BigInt.fromI32(0)
    }

    stats.day = day

    if(metric == 'inks') {
      stats.inks = stats.inks + value
      dailyStats.inks = dailyStats.inks + value
    }
    else if (metric == 'tokens') {
      stats.tokens = stats.tokens + value
      dailyStats.tokens = dailyStats.tokens + value
    }
    else if (metric == 'upgrades') {
      stats.upgrades = stats.upgrades + value
      dailyStats.upgrades = dailyStats.upgrades + value
    }
    else if (metric == 'sales') {
      stats.sales = stats.sales + value
      dailyStats.sales = dailyStats.sales + value
    }
    else if (metric == 'saleValue') {
      stats.saleValue = stats.saleValue + value
      dailyStats.saleValue = dailyStats.saleValue + value
    }
    else if (metric == 'artists') {
      stats.artists = stats.artists + value
      dailyStats.artists = dailyStats.artists + value
    }
    else if (metric == 'users') {
      stats.users = stats.users + value
      dailyStats.users = dailyStats.users + value
    }

    stats.save()
    dailyStats.save()
  }

function checkBestPrice(ink: Ink): Ink {

  if(ink !== null) {
    if(ink.mintPrice.isZero() || ink.count >= ink.limit) {
      ink.bestPrice = BigInt.fromI32(0)
      ink.bestPriceSource = null
      ink.bestPriceSetAt = null
    } else {
      ink.bestPrice = ink.mintPrice
      ink.bestPriceSource = 'ink'
      ink.bestPriceSetAt = ink.mintPriceSetAt
    }

    for (let i = 0, len=ink.tokens.length; i < len; i++) {
        let tokens = ink.tokens
        let id = tokens[i]
        let token = Token.load(id)

        if(token) {
          if(token.price > BigInt.fromI32(0)) {
            if(ink.bestPrice.isZero()) {
              ink.bestPrice = token.price
              ink.bestPriceSource = id
              ink.bestPriceSetAt = token.priceSetAt
            } else if (token.price < ink.bestPrice) {
              ink.bestPrice = token.price as BigInt
              ink.bestPriceSource = id
              ink.bestPriceSetAt = token.priceSetAt
            }
        }
      }
    }
  }

  return ink
}

export function handlenewInk(event: newInk): void {

  let artist = Artist.load(event.params.artist.toHexString())

  if (artist === null) {
    artist = new Artist(event.params.artist.toHexString())
    artist.address = event.params.artist
    artist.inkCount = BigInt.fromI32(1)
    artist.earnings = BigInt.fromI32(0)
    artist.likeCount = BigInt.fromI32(0)
    artist.saleCount = BigInt.fromI32(0)
    artist.lastLikeAt = BigInt.fromI32(0)
    artist.lastSaleAt = BigInt.fromI32(0)
    artist.createdAt = event.block.timestamp
    artist.lastInkAt = event.block.timestamp
    incrementTotal('artists',event.block.timestamp, BigInt.fromI32(1))
  }
  else {
    artist.inkCount = artist.inkCount.plus(BigInt.fromI32(1))
    artist.lastInkAt = event.block.timestamp
  }

  let user = getUser(event.params.artist.toHexString(), event.block.timestamp)
  if(user) {
    user.lastInkAt = event.block.timestamp
    user.inkCount = user.inkCount.plus(BigInt.fromI32(1))
    user.save()
  }

  let ink = Ink.load(event.params.inkUrl)

  if (ink === null) {
    ink = new Ink(event.params.inkUrl)
  }

//  let jsonBytes = ipfs.cat(event.params.jsonUrl)
//  if (jsonBytes !== null) {
//    let data = json.fromBytes(jsonBytes!);
//    if (data !== null) {
//      if (data.kind !== JSONValueKind.OBJECT) {
//        log.debug('[mapping] [loadIpfs] JSON data from IPFS is not an OBJECT', [
//        ]);
//    } else {
//        let obj = data.toObject();
//        ink.name = obj.get("name").toString();
//        ink.image = obj.get("image").toString();
//        ink.description = obj.get("description").toString();
//      }
//  }
//  }

  ink.inkNumber = event.params.id
  ink.artist = artist.id
  ink.limit = event.params.limit
  ink.jsonUrl = event.params.jsonUrl
  ink.createdAt = event.block.timestamp
  ink.tokens = []
  ink.mintPrice = BigInt.fromI32(0)
  ink.bestPrice = BigInt.fromI32(0)
  ink.likeCount = BigInt.fromI32(0)
  ink.mintPriceNonce = BigInt.fromI32(0)
  ink.count = BigInt.fromI32(0)
  ink.burnedCount = BigInt.fromI32(0)
  ink.burned = false

  ink.save()
  artist.save()

  let inkLookup = new InkLookup(ink.inkNumber.toString())
  inkLookup.inkId = ink.id
  inkLookup.save()

  incrementTotal('inks',event.block.timestamp, BigInt.fromI32(1))
  updateMetaData('blockNumber',event.block.number.toString())
}

function _handleSetPrice(inkUrl: String, price: BigInt, timestamp: BigInt): void {

  let ink = Ink.load(inkUrl)

  if(ink) {
    ink.mintPriceNonce = ink.mintPriceNonce + BigInt.fromI32(1)
    ink.mintPrice = price
    ink.mintPriceSetAt = timestamp

    if(price > BigInt.fromI32(0)) {

      if(ink.bestPrice.isZero() && ink.count < ink.limit) {
        ink.bestPrice = price
        ink.bestPriceSource = 'ink'
        ink.bestPriceSetAt = timestamp
      } else if (price <= ink.bestPrice && ink.count < ink.limit) {
        ink.bestPrice = price
        ink.bestPriceSource = 'ink'
        ink.bestPriceSetAt = timestamp
      } else {
        ink = checkBestPrice(ink)
      }
    } else {
      ink = checkBestPrice(ink)
    }

    if(ink) {
      ink.save()
    }
  }
}

export function handleNewInkPrice(event: newInkPrice): void {
  _handleSetPrice(event.params.inkUrl, event.params.price, event.block.timestamp)
  updateMetaData('blockNumber',event.block.number.toString())
}

export function handleSetPriceFromSignature(call: SetPriceFromSignatureCall): void {
  _handleSetPrice(call.inputs.inkUrl, call.inputs.price, call.block.timestamp)
  updateMetaData('blockNumber',call.block.number.toString())
}

export function handleSetPrice(call: SetPriceCall): void {
  _handleSetPrice(call.inputs.inkUrl, call.inputs.price, call.block.timestamp)
  updateMetaData('blockNumber',call.block.number.toString())
}

export function handleNewTokenPrice(event: newTokenPrice): void {

  _handleSetTokenPrice(event.params.id.toString(), event.params.price, event.block.timestamp)
  updateMetaData('blockNumber',event.block.number.toString())
}

export function handleSetTokenPrice(call: SetTokenPriceCall): void {

  _handleSetTokenPrice(call.inputs._tokenId.toString(), call.inputs._price, call.block.timestamp)
  updateMetaData('blockNumber',call.block.number.toString())
}

function _handleSetTokenPrice(tokenId: String, price: BigInt, timestamp: BigInt): void {
  let token = Token.load(tokenId)
  if(token) {
    let ink = Ink.load(token.ink)

    if(ink) {
      token.price = price
      token.priceSetAt = timestamp
      token.save()

      if(token.price > BigInt.fromI32(0)) {
        if(ink.bestPrice.isZero()) {
          ink.bestPrice = token.price
          ink.bestPriceSource = token.id
          ink.bestPriceSetAt = token.priceSetAt
        } else if (token.price < ink.bestPrice) {
          ink.bestPrice = token.price
          ink.bestPriceSource = token.id
          ink.bestPriceSetAt = token.priceSetAt
        }
      } else if(ink.bestPrice > BigInt.fromI32(0)) {
          ink = checkBestPrice(ink)
      }

      if (ink) {
        ink.save();
      }
    }
  }
}

export function handleMintedInk(event: mintedInk): void {

  let ink = Ink.load(event.params.inkUrl)

  if(ink) {
    ink.count = ink.count.plus(BigInt.fromI32(1))

    if(event.params.to != Address.fromString("0x000000000000000000000000000000000000dEaD")) {
      ink.burned = false
    }

    if (ink.count == ink.limit && ink.limit != BigInt.fromI32(1)) {

      ink.mintPrice = BigInt.fromI32(0)
      ink.mintPriceSetAt = event.block.timestamp

      if(ink.bestPrice > BigInt.fromI32(0)) {
        ink = checkBestPrice(ink)
      }
    }

    let tokenArray = ink.tokens
    tokenArray.push(event.params.id.toString())
    ink.tokens = tokenArray

    let token = new Token(event.params.id.toString())

    token.ink = event.params.inkUrl
    token.owner = event.params.to.toHexString()
    token.createdAt = event.block.timestamp
    token.lastTransferAt = event.block.timestamp
    token.network = "xdai"
    token.price = BigInt.fromI32(0)
    token.burned = false
    token.transferCount = BigInt.fromI32(0)
    token.artist = ink.artist
    token.edition = ink.count

    let tokenTransfer = TokenTransfer.load(token.id + "-" + token.transferCount.toString())

    if (tokenTransfer) {
      tokenTransfer.ink = token.ink
      tokenTransfer.artist = ink.artist
      tokenTransfer.save()
    }

    if(event.params.to.toHexString() == ink.artist) {
      token.collector = null
    } else {
      token.collector = event.params.to.toHexString()
    }

    ink.save()
    token.save()

    incrementTotal('tokens',event.block.timestamp, BigInt.fromI32(1))
    updateMetaData('blockNumber',event.block.number.toString())
  }
}

export function handleTransfer(event: Transfer): void {

  let tokenId = event.params.tokenId.toString()

  let token = Token.load(tokenId)
  let inkId = ''
  let artistId = ''

  if (token !== null) {
    token.owner = event.params.to.toHexString()
    token.transferCount = token.transferCount + BigInt.fromI32(1)
    token.lastTransferAt = event.block.timestamp

    let ink = Ink.load(token.ink)

    if(ink) {

      inkId = token.ink
      artistId = ink.artist

      if(event.params.to.toHexString() == artistId) {
        token.collector = null
      } else {
        token.collector = event.params.to.toHexString()
      }

      if(event.params.to == Address.fromString("0x0000000000000000000000000000000000000000") || event.params.to == Address.fromString("0x000000000000000000000000000000000000dEaD")) {
        token.burned = true
        ink.burnedCount = ink.burnedCount + BigInt.fromI32(1)
        if(ink.burnedCount >= ink.count) {
          ink.burned = true
        }
      }

      if(token.price > BigInt.fromI32(0)) {
        token.price = BigInt.fromI32(0)
        token.priceSetAt = event.block.timestamp
        token.save()
        ink = checkBestPrice(ink)
        }
      else {
        token.save()
      }

      ink.save()
    }
    }

  let transferCount = (token !== null) ? token.transferCount.toString() : '0'

  log.info('Transfer is: {}', [tokenId + "-" + transferCount])

  let transfer = new TokenTransfer(tokenId + "-" + transferCount)

  transfer.token = tokenId
  transfer.to = event.params.to.toHexString()
  transfer.from = event.params.from.toHexString()
  transfer.createdAt = event.block.timestamp
  transfer.transactionHash = event.transaction.hash.toHex()
  transfer.ink = inkId
  transfer.artist = artistId

  if(event.address == Address.fromString("0xCF964c89f509a8c0Ac36391c5460dF94B91daba5")) {
    transfer.network = 'xdai'
  }
  if(event.address == Address.fromString("0xc02697c417DdAcfbe5EdbF23eDad956BC883F4fb")) {
    transfer.network = 'mainnet'
  }

  transfer.save()
  updateMetaData('blockNumber',event.block.number.toString())

  let fromUser = getUser(transfer.from, event.block.timestamp)
  fromUser.tokenCount = fromUser.tokenCount.minus(BigInt.fromI32(1))
  fromUser.fromCount = fromUser.fromCount.plus(BigInt.fromI32(1))
  fromUser.lastTransferAt = event.block.timestamp
  if(fromUser.id != artistId) {
    fromUser.collectionCount = fromUser.collectionCount.minus(BigInt.fromI32(1))
  }
  fromUser.save()

  let toUser = getUser(transfer.to, event.block.timestamp)
  toUser.tokenCount = toUser.tokenCount.plus(BigInt.fromI32(1))
  toUser.toCount = toUser.toCount.plus(BigInt.fromI32(1))
  toUser.lastTransferAt = event.block.timestamp
  if(toUser.id != artistId) {
    toUser.collectionCount = toUser.collectionCount.plus(BigInt.fromI32(1))
  }
  toUser.save()
}

export function handleBoughtInk(event: boughtInk): void {

  let sale = new Sale(event.transaction.hash.toHex() + "-" + event.logIndex.toString())

  let tokenId = event.params.id.toString()

  let token = Token.load(tokenId)
  let ink = Ink.load(event.params.inkUrl)
  if(ink && token) {
    let artist = Artist.load(ink.artist)
    if(artist) {
      let transfer = TokenTransfer.load(tokenId + "-" + token.transferCount.toString())

      //let contract = NiftyInk.bind(Address.fromString("0x49dE55fbA08af88f55EB797a456fdf76B151c8b0"))
      //let artistTake = contract.artistTake()

      if (transfer) {
        if (transfer.from == "0x0000000000000000000000000000000000000000" || transfer.from == artist.id) {
          sale.saleType = "primary"
          sale.artistTake = event.params.price
          sale.seller = artist.id
          artist.earnings = artist.earnings + event.params.price
        } else {
          sale.saleType = "secondary"
          sale.artistTake = (((event.params.price).times(BigInt.fromI32(1))) / BigInt.fromI32(100))
          sale.seller = transfer.from
          artist.earnings = artist.earnings + sale.artistTake
        }
        transfer.sale = event.transaction.hash.toHex() + "-" + event.logIndex.toString()
        transfer.save()
        log.info('Transfer is found: {}, from {} to {}', [transfer.id, transfer.from, transfer.to])
      } else {
       log.info('Transfer is unavailable: {}', [tokenId + "-" + token.transferCount.toString()])
      }

      artist.saleCount = artist.saleCount.plus(BigInt.fromI32(1))
      artist.lastSaleAt = event.block.timestamp

      sale.token = tokenId
      sale.price = event.params.price
      sale.buyer = event.params.buyer.toHexString()
      sale.artist = ink.artist
      sale.ink = event.params.inkUrl
      sale.createdAt = event.block.timestamp
      sale.transfer = tokenId + "-" + token.transferCount.toString()
      sale.transactionHash = event.transaction.hash.toHex()

      sale.save()
      artist.save()

      incrementTotal('sales',event.block.timestamp, BigInt.fromI32(1))
      incrementTotal('saleValue',event.block.timestamp, sale.price)
      updateMetaData('blockNumber',event.block.number.toString())


      let buyingUser = getUser(sale.buyer, event.block.timestamp)
      buyingUser.purchaseCount = buyingUser.purchaseCount.plus(BigInt.fromI32(1))
      buyingUser.purchaseValue = buyingUser.purchaseValue + event.params.price
      buyingUser.lastPurchaseAt = event.block.timestamp
      buyingUser.save()

      let sellingUser = getUser(sale.seller, event.block.timestamp)
      sellingUser.saleCount = sellingUser.saleCount.plus(BigInt.fromI32(1))
      sellingUser.saleValue = sellingUser.saleValue + event.params.price
      sellingUser.lastSaleAt = event.block.timestamp
      sellingUser.save()

    }
  }
}

export function handleMintedOnMain (event: mintedInk): void {

  let token = Token.load(event.params.id.toString())

  if(token) {

    token.network = "mainnet"
    token.upgradeTransfer = token.id + "-" + token.transferCount.toString()

    token.save()
    updateMetaData('blockNumber',event.block.number.toString())
  }
}

export function handleTokenSentViaBridge (event: tokenSentViaBridge): void {

  let token = Token.load(event.params._tokenId.toString())

  if(token) {

    token.network = "mainnet"
    token.upgradeTransfer = token.id + "-" + token.transferCount.toString()

    token.save()

    incrementTotal('upgrades',event.block.timestamp, BigInt.fromI32(1))
    updateMetaData('blockNumber',event.block.number.toString())
  }
}

export function handleNewRelayPrice (event: newPrice): void {

  let currentPrice = RelayPrice.load("current")

  if (currentPrice != null) {
    currentPrice.id = currentPrice.createdAt.toString()
    currentPrice.save()
  }

  let updatedPrice = new RelayPrice("current")
  updatedPrice.price = event.params.price
  updatedPrice.createdAt = event.block.timestamp
  updatedPrice.save()
  updateMetaData('blockNumber',event.block.number.toString())
}

export function handleLikedInk (event: liked): void {

  let inkLookup = InkLookup.load(event.params.target.toString())

  if(inkLookup){
    let ink = Ink.load(inkLookup.inkId)
    if(ink) {
      ink.likeCount = ink.likeCount + BigInt.fromI32(1)
      ink.save()

      let newLike = new Like(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
      newLike.liker = event.params.liker.toHexString()
      newLike.ink = inkLookup.inkId
      newLike.createdAt = event.block.timestamp
      newLike.artist = ink.artist
      newLike.save()

      let artist = Artist.load(ink.artist)
      if(artist) {
        artist.likeCount = artist.likeCount.plus(BigInt.fromI32(1))
        artist.lastLikeAt = event.block.timestamp
        artist.save()

        let user = getUser(event.params.liker.toHexString(), event.block.timestamp)
        user.likeCount = user.likeCount.plus(BigInt.fromI32(1))
        user.lastLikeAt = event.block.timestamp
        user.save()
      }
    }
  }

}

function getUser(id: String, timestamp: BigInt): User {

  let user = User.load(id)

  if (user === null) {
    user = new User(id)
    user.address = Address.fromString(id)
    user.artist = id
    user.tokenCount = BigInt.fromI32(0)
    user.likeCount = BigInt.fromI32(0)
    user.purchaseCount = BigInt.fromI32(0)
    user.purchaseValue = BigInt.fromI32(0)
    user.saleCount = BigInt.fromI32(0)
    user.saleValue = BigInt.fromI32(0)
    user.lastLikeAt = BigInt.fromI32(0)
    user.lastPurchaseAt = BigInt.fromI32(0)
    user.lastSaleAt = BigInt.fromI32(0)
    user.fromCount = BigInt.fromI32(0)
    user.toCount = BigInt.fromI32(0)
    user.inkCount = BigInt.fromI32(0)
    user.collectionCount = BigInt.fromI32(0)
    user.lastInkAt = BigInt.fromI32(0)
    user.createdAt = timestamp
    incrementTotal('users',timestamp, BigInt.fromI32(1))
    return user
  }
  else {
    return user
  }
}

import React, { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route} from "react-router-dom";
import Item from "./Item";
import Minter from "./Minter";
import { opend_backend as opend } from "../../../declarations/opend_backend";
import CURRENT_USER_ID from "../index";
import Gallery from "./Gallery";
import homeImage from "../../assets/home-img.png";
import { useLocation } from "react-router-dom";

function App() {
  const [userOwnedGallery, setUserOwnedGalley] = useState();
  const [listingGallery, setListingGallery] = useState();
  
  async function getNFTs() {
    const userNFTIds = await opend.getOwnedNFTs(CURRENT_USER_ID);
    console.log(userNFTIds);
    setUserOwnedGalley(<Gallery title="My NFTs" ids={userNFTIds} role="collection"/>);

    const listedNFTIds = await opend.getListedNFTs();
    console.log(listedNFTIds);
    setListingGallery(<Gallery title={"Discover"} ids={listedNFTIds} role="discover" />);
  };

  useEffect(() => {
    getNFTs();
  }, [])

  // const NFTID = "br5f7-7uaaa-aaaaa-qaaca-cai";
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <Routes>
          <Route exact path="/" element={<img className="bottom-space" src={homeImage} />} />
          <Route path="/discover" element={listingGallery} />
          <Route path="/minter" element={<Minter />} />
          {userOwnedGallery && <Route path="/collection" element={userOwnedGallery}/>}
        </Routes>
        {/* <Minter /> */}
        {/* <Item id={NFTID}/> */}
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

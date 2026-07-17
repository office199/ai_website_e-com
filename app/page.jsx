'use client'
import { useState } from 'react'

const products = [
  {id:1, name:'The Essential Blazer', type:'Women · Tailoring', price:148, color:'Oat', image:'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=85'},
  {id:2, name:'Relaxed Studio Shirt', type:'Men · New in', price:82, color:'White', image:'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=85'},
  {id:3, name:'Soft Knit Set', type:'Baby · 0–24 months', price:48, color:'Rose', image:'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=85'},
  {id:4, name:'Weekend Denim', type:'Kids · Everyday', price:62, color:'Indigo', image:'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?auto=format&fit=crop&w=900&q=85'},
]

function Icon({name}) { const icons={bag:'♧',heart:'♡',user:'◯',search:'⌕',arrow:'→',plus:'+'}; return <span className={'icon '+name}>{icons[name]}</span> }

export default function Home(){
 const [bag,setBag]=useState([]); const [wish,setWish]=useState([]); const [notice,setNotice]=useState('');
 const add=(p)=>{setBag([...bag,p]);setNotice(`${p.name} added to your bag`);setTimeout(()=>setNotice(''),2500)}
 const toggleWish=(p)=>setWish(wish.some(x=>x.id===p.id)?wish.filter(x=>x.id!==p.id):[...wish,p])
 return <main>
  <div className="announcement"><span>Complimentary shipping on orders over $100</span><span className="hide-mobile">Easy 30-day returns · Made to last</span><span>USD / EN⌄</span></div>
  <nav><a className="wordmark">MODÉ<span>®</span></a><div className="desktop-links"><a href="#new">New arrivals</a><a href="#women">Women</a><a href="#men">Men</a><a href="#kids">Kids & baby</a><a href="#journal">Journal</a></div><div className="actions"><button aria-label="Search"><Icon name="search"/></button><button aria-label="Wishlist"><Icon name="heart"/><i>{wish.length}</i></button><button aria-label="Account"><Icon name="user"/></button><button className="bag-button" aria-label="Bag"><Icon name="bag"/><b>Bag ({bag.length})</b></button></div></nav>
  {notice&&<div className="toast">✓ {notice}</div>}
  <section className="hero"><div className="hero-copy"><p className="eyebrow">Spring / Summer 2025</p><h1>Made for the<br/><em>in-between</em> moments.</h1><p className="hero-text">Thoughtfully made pieces for a life lived fully — wherever the day takes you.</p><div className="hero-actions"><a href="#new" className="button dark">Shop women <Icon name="arrow"/></a><a href="#new" className="text-link">Shop men <Icon name="arrow"/></a></div></div><div className="hero-image"><div className="image-label"><span>01 — The everyday edit</span><span>Scroll to explore ↓</span></div></div></section>
  <section className="categories"><a id="women" className="category cat-one"><div><span>For her</span><h2>Women</h2><p>Explore collection <Icon name="arrow"/></p></div></a><a id="men" className="category cat-two"><div><span>For him</span><h2>Men</h2><p>Explore collection <Icon name="arrow"/></p></div></a><a id="kids" className="category cat-three"><div><span>For little ones</span><h2>Kids & baby</h2><p>Explore collection <Icon name="arrow"/></p></div></a></section>
  <section className="products" id="new"><div className="section-heading"><div><p className="eyebrow">Just landed</p><h2>New, now.</h2></div><a className="text-link">Shop all arrivals <Icon name="arrow"/></a></div><div className="product-grid">{products.map((p,i)=><article className="product" key={p.id}><div className="product-image" style={{backgroundImage:`url(${p.image})`}}><span className="product-tag">{i===0?'Bestseller':'New'}</span><button className={'wish '+(wish.some(x=>x.id===p.id)?'active':'')} onClick={()=>toggleWish(p)} aria-label="Add to wishlist">♥</button><button className="quick-add" onClick={()=>add(p)}>Quick add <Icon name="plus"/></button></div><div className="product-info"><div><h3>{p.name}</h3><p>{p.type}</p></div><strong>${p.price}</strong></div><small>{p.color}</small></article>)}</div></section>
  <section className="story"><div className="story-image"></div><div className="story-copy"><p className="eyebrow">Our point of view</p><h2>Less, but<br/><em>better.</em></h2><p>We make versatile, enduring clothes with a lighter footprint. Because the best things in your wardrobe should feel as good as they look.</p><a className="text-link">Our approach <Icon name="arrow"/></a><div className="numbers"><div><b>72%</b><span>lower impact materials</span></div><div><b>100%</b><span>made to be reworn</span></div></div></div></section>
  <section className="newsletter"><p className="eyebrow">Stay in the know</p><h2>The good kind of inbox.</h2><p>New pieces, fresh ideas, and 10% off your first order.</p><form onSubmit={e=>{e.preventDefault();setNotice('Welcome to MODÉ. Your 10% code is on its way!')}}><input type="email" required placeholder="Your email address"/><button>Join us <Icon name="arrow"/></button></form></section>
  <footer><div><a className="wordmark">MODÉ<span>®</span></a><p>Better everyday things,<br/>for every kind of day.</p></div><div className="footer-links"><div><b>Shop</b><a>Women</a><a>Men</a><a>Kids & baby</a><a>Gift cards</a></div><div><b>About</b><a>Our story</a><a>Materials</a><a>Journal</a><a>Careers</a></div><div><b>Help</b><a>Shipping & returns</a><a>Contact</a><a>Size guide</a><a>FAQ</a></div></div><small>© 2025 MODÉ. All rights reserved.</small></footer>
 </main>
}

const express = require('express');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendCode } = require('../services/email');
const { auth } = require('../middleware/auth');
const router = express.Router();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const code = () => String(crypto.randomInt(0, 1000000)).padStart(6,'0');
const adminEmails = () => new Set((process.env.ADMIN_EMAILS || '').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean));
function safeUser(user) { return { id:user._id, name:user.name, email:user.email, phone:user.phone, role:user.role, emailVerified:user.emailVerified, store:user.store, addresses:user.addresses }; }
function tokenFor(user) { return jwt.sign({ sub:user._id.toString(), role:user.role }, process.env.JWT_SECRET, { expiresIn:'7d' }); }
router.post('/register', async (req,res,next)=>{try{
  const {name,email,password,phone,accountType='buyer',storeName} = req.body || {};
  if(!name?.trim() || !email?.trim() || typeof password!=='string' || password.length<8) return res.status(400).json({error:'Name, email and a password of at least 8 characters are required.'});
  if(!['buyer','seller'].includes(accountType)) return res.status(400).json({error:'Choose buyer or seller account type.'});
  const normalized=email.trim().toLowerCase(); if(await User.exists({email:normalized})) return res.status(409).json({error:'An account with this email already exists.'});
  const isAdmin=adminEmails().has(normalized); const ownerEmail=(process.env.OWNER_EMAIL||'').trim().toLowerCase();
  const user=await User.create({name:name.trim(),email:normalized,phone:phone||'',passwordHash:await bcrypt.hash(password,12),role:isAdmin?'admin':accountType,emailVerified:false,store:accountType==='seller'?{name:(storeName||`${name.trim()}'s Store`).trim(),description:''}:undefined});
  if(ownerEmail && normalized===ownerEmail && !isAdmin) { user.role='admin'; await user.save(); }
  const verification=code(); user.verificationCodeHash=hash(verification);user.verificationExpiresAt=new Date(Date.now()+10*60*1000);await user.save();
  try{await sendCode(user.email,verification,'verify');}catch(e){await User.deleteOne({_id:user._id});return res.status(503).json({error:`Account could not be completed because email delivery is unavailable. ${e.message}`});}
  res.status(201).json({message:'Account created. Check your email for the verification code.',email:user.email});
}catch(e){next(e)}});
router.post('/verify-email', async(req,res,next)=>{try{const {email,code:submitted}=req.body||{};const user=await User.findOne({email:String(email||'').toLowerCase().trim()});if(!user||!user.verificationCodeHash||!user.verificationExpiresAt||user.verificationExpiresAt<Date.now()||hash(String(submitted||''))!==user.verificationCodeHash)return res.status(400).json({error:'The code is invalid or expired. Request a new code.'});user.emailVerified=true;user.verificationCodeHash=undefined;user.verificationExpiresAt=undefined;await user.save();const token=tokenFor(user);res.cookie('merxiom_token',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.COOKIE_SAME_SITE||'lax',maxAge:7*24*60*60*1000});res.json({user:safeUser(user),token});}catch(e){next(e)}});
router.post('/resend-code',async(req,res,next)=>{try{const user=await User.findOne({email:String(req.body?.email||'').toLowerCase().trim()});if(!user)return res.json({message:'If the account exists, a code will be sent.'});if(user.emailVerified)return res.status(400).json({error:'This email is already verified.'});const c=code();user.verificationCodeHash=hash(c);user.verificationExpiresAt=new Date(Date.now()+10*60*1000);await user.save();await sendCode(user.email,c,'verify');res.json({message:'A new verification code has been sent.'});}catch(e){next(e)}});
router.post('/login',async(req,res,next)=>{try{const email=String(req.body?.email||'').toLowerCase().trim();const user=await User.findOne({email});if(!user||!user.passwordHash||!await bcrypt.compare(String(req.body?.password||''),user.passwordHash))return res.status(401).json({error:'Email or password is incorrect. If this is an older account, use password reset or register again if the account does not exist.'});if(adminEmails().has(email)&&user.role!=='admin'){user.role='admin';await user.save();}if(!user.emailVerified)return res.status(403).json({error:'Please verify your email before signing in.',needsVerification:true,email:user.email});const token=tokenFor(user);res.cookie('merxiom_token',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.COOKIE_SAME_SITE||'lax',maxAge:7*24*60*60*1000});res.json({user:safeUser(user),token});}catch(e){next(e)}});
router.post('/logout',(req,res)=>{res.clearCookie('merxiom_token');res.json({message:'Signed out.'});});
router.get('/me',auth,async(req,res)=>res.json({user:safeUser(await User.findById(req.user._id))}));
router.post('/forgot-password',async(req,res,next)=>{try{const user=await User.findOne({email:String(req.body?.email||'').toLowerCase().trim()});if(!user)return res.json({message:'If the account exists, a reset code will be sent.'});const c=code();user.resetCodeHash=hash(c);user.resetExpiresAt=new Date(Date.now()+10*60*1000);await user.save();await sendCode(user.email,c,'reset');res.json({message:'If the account exists, a reset code will be sent.'});}catch(e){next(e)}});
router.post('/reset-password',async(req,res,next)=>{try{const email=String(req.body?.email||'').toLowerCase().trim();const user=await User.findOne({email});if(!user||!user.resetCodeHash||!user.resetExpiresAt||user.resetExpiresAt<Date.now()||hash(String(req.body?.code||''))!==user.resetCodeHash)return res.status(400).json({error:'The code is invalid or expired.'});const password=String(req.body?.password||'');if(password.length<8)return res.status(400).json({error:'Password must contain at least 8 characters.'});user.passwordHash=await bcrypt.hash(password,12);user.resetCodeHash=undefined;user.resetExpiresAt=undefined;await user.save();res.json({message:'Password updated. You can now sign in.'});}catch(e){next(e)}});
module.exports=router;

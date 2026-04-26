#!/usr/bin/env -S deno run --allow-net

const PORT = Number(Deno.env.get('REALMS_PROXY_PORT') ?? 8787)
const TARGET_BASE_URL = Deno.env.get('REALMS_PROXY_TARGET') ?? 'https://www.minicurso.me'
const ALLOWED_ORIGIN = Deno.env.get('REALMS_PROXY_ORIGIN') ?? 'http://localhost:1111'

function buildCorsHeaders(requestOrigin) {
  const origin = requestOrigin === ALLOWED_ORIGIN ? requestOrigin : ALLOWED_ORIGIN

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function withCorsHeaders(response, requestOrigin) {
  const headers = new Headers(response.headers)
  const corsHeaders = buildCorsHeaders(requestOrigin)

  for (const [key, value] of Object.entries(corsHeaders)) { 
    headers.set(key, value)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function makeOptionsResponse(requestOrigin) {
  return new Response(null, {
    status: 204,
    headers: buildCorsHeaders(requestOrigin),
  })
}

function buildTargetUrl(requestUrl) {
  const url = new URL(requestUrl)
  const target = new URL(TARGET_BASE_URL)
  target.pathname = url.pathname
  target.search = url.search
  return target
}

async function handler(request) {
  const requestUrl = new URL(request.url)
  const requestOrigin = request.headers.get('Origin') ?? ''

  if (!requestUrl.pathname.startsWith('/api/realms')) {
    return new Response('Not found', { status: 404 })
  }

  if (request.method === 'OPTIONS') {
    return makeOptionsResponse(requestOrigin)
  }

  const upstreamUrl = buildTargetUrl(request.url)
  const upstreamHeaders = new Headers(request.headers)
  upstreamHeaders.delete('host')
  upstreamHeaders.delete('origin')

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers: upstreamHeaders,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'follow',
  })

  return withCorsHeaders(upstreamResponse, requestOrigin)
}

console.log(`Realms proxy listening on http://localhost:${PORT}`)
console.log(`Forwarding /api/realms* to ${TARGET_BASE_URL}`)
console.log(`Allowing origin ${ALLOWED_ORIGIN}`)

Deno.serve({ port: PORT }, handler)

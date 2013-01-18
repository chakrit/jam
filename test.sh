#!/bin/sh
for f in test/*.js
do
  echo ------------ $f
  node $f
done

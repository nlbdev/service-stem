#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

REPLICAS=$1
if [ "$REPLICAS" != "" ]; then
    shift
fi
PORT=$1
if [ "$PORT" != "" ]; then
    shift
fi

TEMPFILE="`tempfile`"
docker build . | tee $TEMPFILE
BUILD_ID="`cat $TEMPFILE | tail -n 1 | awk '{print $3}'`"
echo "BUILD_ID: $BUILD_ID"
RM="--rm"
IT="-it"

if [ "$PORT" == "" ]; then
    REPLICAS=1
fi
if [ "$REPLICAS" != "" ] && [ $REPLICAS -gt 1 ]; then
    IT="-d"
fi

# Example: ./run.sh 2 18000
set -x
while [ $REPLICAS -gt 0 ]; do
    set +e
    REPLICAS=`expr $REPLICAS - 1`
    if [ "$?" != "0" ]; then REPLICAS=0 ; fi
    set -e
    docker run \
      $RM $IT \
      --network host \
      --env-file config.env \
      --env PORT=`expr $PORT + $REPLICAS` \
      "$BUILD_ID" "$@"
done

if [ "$IT" = "-d" ]; then
  read -p "Press a button to stop (kill) the containers..."

  docker ps | grep $BUILD_ID | awk '{print $1}' | xargs docker kill
fi

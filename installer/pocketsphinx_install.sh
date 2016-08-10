cd ~
sudo apt-get install bison libasound2-dev autoconf automake libtool python-dev swig python-pip -y
cd ~
git clone https://github.com/cmusphinx/sphinxbase.git
cd sphinxbase
./autogen.sh
./configure --enable-fixed
make
sudo make install
cd ~
git clone https://github.com/cmusphinx/pocketsphinx.git
cd pocketsphinx
./autogen.sh
./configure
make
sudo make install
export LD_LIBRARY_PATH=/usr/local/lib 
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig
cd ~
mkdir cmucltk/
cd cmucltk/
wget https://sourceforge.net/projects/cmusphinx/files/cmuclmtk/0.7/cmuclmtk-0.7.tar.gz
tar -xvzf cmuclmtk-0.7.tar.gz
cd cmuclmtk-0.7
./configure 
make
sudo make install
cd ~
mkdir tensorflow
cd tensorflow
wget https://github.com/samjabrahams/tensorflow-on-raspberry-pi/raw/master/bin/tensorflow-0.9.0-cp27-none-linux_armv7l.whl
sudo pip install tensorflow-0.9.0-cp27-none-linux_armv7l.whl
cd ~
mkdir g2p
cd g2p
git clone https://github.com/cmusphinx/g2p-seq2seq.git
cd g2p-seq2seq
sudo python setup.py install

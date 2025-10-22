import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Form, Button, Card, Spinner, Alert, Col, Row } from 'react-bootstrap';

// Avatar component for handling image uploads
function Avatar({ url, size, onUpload }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  async function downloadImage(path) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  }

  async function uploadAvatar(event) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      if (uploadError) throw uploadError;

      onUpload(filePath);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="text-center">
      <img
        src={avatarUrl ? avatarUrl : `https://place-hold.it/${size}x${size}`}
        alt="Avatar"
        className="avatar image rounded-circle"
        style={{ height: size, width: size, objectFit: 'cover' }}
      />
      <div className="mt-2">
        <Button as="label" htmlFor="single" variant="outline-primary" disabled={uploading}>
          {uploading ? 'アップロード中...' : 'アバターを更新'}
        </Button>
        <input
          style={{ display: 'none' }}
          type="file"
          id="single"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
        />
      </div>
    </div>
  );
}

// Profile component
export default function Profile({ session }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    username: '',
    full_name: '',
    bio: '',
    avatar_url: '',
  });

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const { user } = session;
        const { data, error, status } = await supabase
          .from('profiles')
          .select(`username, full_name, bio, avatar_url`)
          .eq('id', user.id)
          .single();

        if (error && status !== 406) throw error;

        if (data) {
          setProfile(data);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    getProfile();
  }, [session]);

  const handleInputChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const updateProfile = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const { user } = session;
      const updates = {
        id: user.id,
        ...profile,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      alert('プロフィールを更新しました！');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner animation="border" />;
  
  return (
    <Card>
      <Card.Body>
        <Card.Title>プロフィール設定</Card.Title>
        <Card.Subtitle className="mb-3 text-muted">公開されるプロフィール情報を入力してください。</Card.Subtitle>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={updateProfile}>
          <Row>
            <Col md={4} className="mb-3">
              <Avatar
                url={profile.avatar_url}
                size={150}
                onUpload={(filePath) => {
                  setProfile({ ...profile, avatar_url: filePath });
                }}
              />
            </Col>
            <Col md={8}>
              <Form.Group className="mb-3" controlId="email">
                <Form.Label>メールアドレス</Form.Label>
                <Form.Control type="text" value={session.user.email} disabled />
              </Form.Group>
              <Form.Group className="mb-3" controlId="username">
                <Form.Label>ユーザー名</Form.Label>
                <Form.Control type="text" name="username" value={profile.username || ''} onChange={handleInputChange} />
              </Form.Group>
              <Form.Group className="mb-3" controlId="fullName">
                <Form.Label>氏名</Form.Label>
                <Form.Control type="text" name="full_name" value={profile.full_name || ''} onChange={handleInputChange} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="bio">
            <Form.Label>自己紹介</Form.Label>
            <Form.Control as="textarea" name="bio" rows={4} value={profile.bio || ''} onChange={handleInputChange} />
          </Form.Group>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? '更新中...' : 'プロフィールを更新'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}
import { ActionIcon, Badge, Box, Button, Container, Group, Text, TextInput } from '@mantine/core';
import { IconHeart, IconSearch, IconShoppingBag, IconUser, IconShieldCheck } from '@tabler/icons-react';
import logo from '../../assets/samira-collection-logo.png';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

const links = [
  ['New Arrivals', '/products?newArrival=true'],
  ['Sarees', '/products?search=Saree'],
  ['Suits', '/products?search=Suit'],
  ['Kurtis', '/products?search=Kurti'],
  ['Lehengas', '/products?search=Lehenga'],
  ['Dresses', '/products?search=Dress'],
  ['Sale', '/products?discount=20'],
  ['Contact', '/contact'],
];

export default function DesktopHeader({ navigate, route = '/' }) {
  const cart = useCart();
  const wishlist = useWishlist();
  const { user, switchMode } = useAuth();
  const searchValue = new URLSearchParams(route.split('?')[1] || '').get('search') || '';
  const routePath = route.split('?')[0];

  if (routePath === '/cart') {
    return (
      <Box component="header" className="hidden lg:block" bg="white" pos="sticky" top={0} style={{ zIndex: 50 }}>
        <Container size={1440} px={16} py={14}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Button variant="subtle" onClick={() => navigate('/')} p={0} h="auto">
              <img src={logo} alt="Samira Collection" style={{ height: 48, width: 'auto' }} />
            </Button>
            <Group gap={14} className="hidden lg:flex">
              <Text size="xs" fw={800} tt="uppercase" c="#22c55e" style={{ letterSpacing: 2.4 }}>
                Bag
              </Text>
              <DividerDot />
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: 2.4 }}>
                Address
              </Text>
              <DividerDot />
              <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: 2.4 }}>
                Payment
              </Text>
            </Group>
            <Group gap={10}>
              <IconShieldCheck size={22} color="#16a34a" />
              <Text size="xs" fw={800} tt="uppercase" style={{ letterSpacing: 2.2 }}>
                100% Secure
              </Text>
            </Group>
          </Group>
        </Container>
      </Box>
    );
  }

  const updateSearch = (value) => {
    const params = new URLSearchParams(route.split('?')[1] || '');
    if (value) params.set('search', value);
    else params.delete('search');
    navigate(`/search${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <Box component="header" className="hidden lg:block" pos="sticky" top={0} style={{ zIndex: 50 }}>
      <Box bg="#4b071b" h={32} style={{ display: 'flex', alignItems: 'center' }}>
        <Container size={1440} px={14} style={{ width: '100%' }}>
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text size="xs" fw={700} tt="uppercase" c="white" ta="center" style={{ letterSpacing: 1.8, flex: 1 }}>
              FREE SHIPPING ON ORDERS ABOVE RS. 999 | NEW FESTIVE COLLECTION LIVE NOW
            </Text>
            <Group gap={10} className="hidden lg:flex">
              <Button variant="subtle" c="rgba(255,255,255,0.8)" color="gray" size="xs" p={0} onClick={() => navigate('/orders')}>
                Track Order
              </Button>
              <Text size="xs" c="rgba(255,255,255,0.42)">
                |
              </Text>
              <Button variant="subtle" c="rgba(255,255,255,0.8)" color="gray" size="xs" p={0} onClick={() => navigate('/contact')}>
                Help & Support
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      <Box bg="white" style={{ borderBottom: '1px solid rgba(123, 24, 52, 0.12)' }}>
        <Container size={1440} px={14} h={80}>
          <Group justify="space-between" align="center" wrap="nowrap" h={80}>
            <Button variant="subtle" onClick={() => navigate('/')} p={0} h="auto">
              <img src={logo} alt="Samira Collection" style={{ height: 46, width: 'auto' }} />
            </Button>

            <Group gap={18} className="hidden lg:flex" wrap="nowrap">
              {links.map(([label, path]) => (
                <Button
                  key={label}
                  variant="subtle"
                  c="#171717"
                  size="xs"
                  fw={800}
                  tt="uppercase"
                  style={{ letterSpacing: 1.1 }}
                  onClick={() => navigate(path)}
                >
                  {label}
                </Button>
              ))}
            </Group>

            <Group gap={10} wrap="nowrap">
              <TextInput
                value={searchValue}
                onFocus={() => {
                  if (!route.startsWith('/search')) navigate('/search');
                }}
                onChange={(event) => updateSearch(event.currentTarget.value)}
                placeholder="Search sarees, suits, kurtis..."
                leftSection={<IconSearch size={16} />}
                radius="xl"
                size="sm"
                w={320}
                styles={{
                  input: {
                    height: 42,
                    background: '#fbf6f1',
                    borderColor: 'rgba(123, 24, 52, 0.14)',
                    color: '#171717',
                  },
                }}
              />

              {user?.role === 'admin' && user?.availableModes?.includes('admin') && user?.activeMode !== 'admin' && (
                <Button radius="xl" size="sm" onClick={() => switchMode('admin')} style={{ background: '#7b1834' }}>
                  Admin Mode
                </Button>
              )}

              <ActionIcon variant="light" radius="xl" size={42} onClick={() => navigate('/profile')}>
                <IconUser size={18} />
              </ActionIcon>

              <ActionIcon variant="light" radius="xl" size={42} onClick={() => navigate('/wishlist')} style={{ position: 'relative' }}>
                <IconHeart size={18} />
                <Badge size="xs" radius="xl" color="red" style={{ position: 'absolute', top: -6, right: -6 }}>
                  {wishlist.items.length}
                </Badge>
              </ActionIcon>

              <ActionIcon variant="filled" radius="xl" size={42} onClick={() => navigate('/cart')} style={{ background: '#171717' }}>
                <IconShoppingBag size={18} />
                <Badge size="xs" radius="xl" color="red" style={{ position: 'absolute', top: -6, right: -6 }}>
                  {cart.itemCount}
                </Badge>
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}

function DividerDot() {
  return <Box w={1} h={14} bg="rgba(255,255,255,0.28)" />;
}
